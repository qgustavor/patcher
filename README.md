# Patcher

A file patcher that works in the browser. Intended to be used by anyone who
distributes any kind of file and wants to provide a simple page where people
can have old files patched easily without having to download binaries or
patches.

## How it works

1. User opens one or more files in the tool
1. The tool generates a keyed Blake3 hash of each file
1. The first 6 bytes of the hash are Base64-URL encoded and used to fetch a patch file
(that's in order to provide *a bit* of anonymity in case someone opens a unknown file)
1. If there's a patch available then it's downloaded, decrypted and decompressed
(patches are encrypted by default in case someone prefers the patch contents to be hidden)
1. The patch is applied and the fixed file is downloaded.

## Demo

[You can test it here.](https://qgustavor.github.io/patcher/)

Test it with [`jquery-3.4.0.min.js`](https://code.jquery.com/jquery-3.4.0.min.js)
to get [`jquery-3.4.1.min.js`](https://code.jquery.com/jquery-3.4.1.min.js) or with
[`vue@2.6.0`](https://unpkg.com/vue@2.6.0/dist/vue.min.js) to get
[`vue@2.6.10`](https://unpkg.com/vue@2.6.10/dist/vue.min.js).

## Limitations

- It's made for modern browsers: it will not work in older browsers.
- *Currently* it uses [Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API)
to process large files without needing to handle entire files in memory. In browsers that don't
fully support this API - like current Firefox - the browser can crash out of memory.
(In future it may use [Native File System API](https://github.com/WICG/native-file-system) for
better performance)
- There are some cases where the patching code isn't efficient resulting in large patches. It
often happen with compressed files or most of the file contents changed.
- Privacy could be improved by reducing the hash identifier from 6 bytes to something lower,
then allowing multiple patches to account for the collisions, but it wasn't implemented
for the sake of simplicity.

## How to use

Copy the code from the repository (you can clone this repository too), delete the sample patches, generate new patches
using `generate-patch.html` then host those somewhere (like GitHub Pages).

If you prefer you can translate `index.html` to your language or edit it as you prefer.
A Portuguese translation is available as `pt.html`. If you want to disable encryption or
compression you can edit `main.js` and `generate-patch.html` removing those steps. To allow
patching large files those are chunked in 8 MiB parts. You can change this variable
in `generate-patch.html`. Using larger chunks will result in smaller patches but those
can crash browsers out of memory.

If you already have some kind of backend you can replace
[this line](https://github.com/qgustavor/patcher/blob/8050733f690031b6079d9fbbe7ab551b4d6d5ddf/generate-patch.html#L146)
with a `fetch()` to your backend, something like
`await fetch('/save-patch.php?name=' + window.encodeURIComponent(patchName), { method: 'POST', body: ciphertext })`.
Remember to use some kind of authentication.

## Libraries used

- [BLAKE3](https://github.com/connor4312/blake3/)
- [FileSaver.js](https://github.com/eligrey/FileSaver.js/)
- [fossil-delta](https://github.com/dchest/fossil-delta-js)
- [pako](https://github.com/nodeca/pako)
- [StreamSaver.js](https://github.com/jimmywarting/StreamSaver.js)
- [tweetnacl](https://github.com/dchest/tweetnacl-js)
- [tweetnacl-util](https://github.com/dchest/tweetnacl-util-js)
- [@ygoe/msgpack](https://github.com/ygoe/msgpack.js)
