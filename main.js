import blake3Loader from 'https://unpkg.com/blake3@2.1.1/browser-async.js'

const fileInput = document.querySelector('.file-input')
const uploadBtn = document.querySelector('.fake-btn')
const uploadMsg = document.querySelector('.file-msg')
const fileList = document.querySelector('.file-list')
const fileItem = document.querySelector('.file-item-template')

const messages = JSON.parse(document.querySelector('.messages').innerHTML)

uploadBtn.addEventListener('click', () => {
  fileInput.click()
})

fileInput.addEventListener('change', () => {
  for (let file of fileInput.files) {
    processFile(file)
  }
})

async function processFile (file) {
  const el = document.importNode(fileItem.content, true)
  const status = el.querySelector('.status')
  el.querySelector('.name').textContent = file.name
  fileList.appendChild(el)

  status.textContent = messages.identifying

  const blake3 = await blake3Loader()
  const blake = blake3.createHash()

  // Prepend the key creating a sort of HMAC
  const key = new TextEncoder().encode('PATCHER')
  blake.update(key)

  const reader = new Response(file).body.getReader()
  let readBytes = 0

  while (1) {
    const data = await reader.read()
    if (data.done) break
    blake.update(data.value)
    readBytes += data.value.length

    const percentage = readBytes * 100 / file.size
    status.textContent = messages.identifying + percentage.toFixed(1) + '%'
  }

  const digest = blake.digest()
  const serverHash = nacl.util.encodeBase64(digest.slice(0, 6))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  status.textContent = messages.checking

  const response = await fetch(`patches/${serverHash}.bin`)
  if (!response.ok) {
    status.textContent = messages.noPatch
    return
  }

  const patchingMessage = supportStreams ? messages.patchingStream : messages.patching
  status.textContent = patchingMessage

  const ciphertext = new Uint8Array(await response.arrayBuffer())
  const nonce = new Uint8Array(24)
  const compressedData = nacl.secretbox.open(ciphertext, nonce, digest)

  if (!compressedData) {
    status.textContent = messages.corruptedPatch
    return
  }

  const payload = msgpack.deserialize(pako.inflateRaw(compressedData))
  const [newFilename, newSize, chunkSize, ...deltas] = payload

  let writer, fileStream
  if (supportStreams) {
    fileStream = streamSaver.createWriteStream(newFilename, {
      size: newSize
    })
    pendingStreams.push(fileStream)
    writer = fileStream.getWriter()
  }

  const chunks = []
  for (let i = 0; i < deltas.length; i++) {
    const chunkStart = i * chunkSize
    const chunkEnd = Math.min(file.size, (i + 1) * chunkSize)

    const chunk = file.slice(chunkStart, chunkEnd)
    const origin = new Uint8Array(await new Response(chunk).arrayBuffer())
    const patchedData = new Uint8Array(fossilDelta.apply(origin, deltas[i]))

    if (supportStreams) {
      await writer.write(patchedData)
    } else {
      chunks.push(patchedData)
    }

    const percentage = i * 100 / deltas.length
    status.textContent = patchingMessage + percentage.toFixed(1) + '%'
  }

  if (supportStreams) {
    writer.close()
    pendingStreams.splice(pendingStreams.indexOf(fileStream), 1)
  } else {
    saveAs(new Blob(chunks), newFilename)
  }

  status.textContent = messages.finished
}

const supportStreams = !!window.WritableStream
const savingScript = document.createElement('script')
savingScript.src = supportStreams
  ? 'https://unpkg.com/streamsaver@2.0.3/StreamSaver.js'
  : 'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.3/FileSaver.min.js'
document.head.appendChild(savingScript)

const pendingStreams = []
if (supportStreams) {
  window.onunload = () => {
    for (let stream of pendingStreams) stream.abort()
  }

  window.onbeforeunload = evt => {
    if (pendingStreams.length) {
      evt.returnValue = messages.pageleave
    }
  }
}
