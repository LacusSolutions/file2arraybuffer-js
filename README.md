# file2arraybuffer

![NPM Latest Version](https://img.shields.io/npm/v/file2arraybuffer)
![Bundle Size](https://img.shields.io/bundlephobia/min/file2arraybuffer?label=bundle%20size)
![Downloads Count](https://img.shields.io/npm/dm/file2arraybuffer.svg)
![Test Status](https://img.shields.io/github/actions/workflow/status/LacusSolutions/file2arraybuffer-js/publish.yml?label=ci/cd)
![Last Update Date](https://img.shields.io/github/last-commit/LacusSolutions/file2arraybuffer-js)
![Project License](https://img.shields.io/github/license/LacusSolutions/file2arraybuffer-js)

A small function that reads a file and returns a promise for its `ArrayBuffer`. Web services such as the SharePoint REST API often expect file uploads in this format.

## Browser support

![Chrome](https://raw.github.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png) | ![Firefox](https://raw.github.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png) | ![Safari](https://raw.github.com/alrra/browser-logos/master/src/safari/safari_48x48.png) | ![Opera](https://raw.github.com/alrra/browser-logos/master/src/opera/opera_48x48.png) | ![Edge](https://raw.github.com/alrra/browser-logos/master/src/edge/edge_48x48.png) | ![IE](https://raw.github.com/alrra/browser-logos/master/src/archive/internet-explorer_9-11/internet-explorer_9-11_48x48.png) |
--- | --- | --- | --- | --- | --- |
Latest ✔ | Latest ✔ | Latest ✔ | Latest ✔ | Latest ✔ | 11 ✔ |

IE11 has no native `Promise`, so load a Promise polyfill before this library. Without one, the function throws a `ReferenceError`.

## Installation

```bash
# using NPM
$ npm install file2arraybuffer

# using Bun
$ bun add file2arraybuffer
```

## Import

```js
// ES Modules
import fileToArrayBuffer from 'file2arraybuffer'

// CommonJS
const fileToArrayBuffer = require('file2arraybuffer')
```

TypeScript types ship with the package.

You can also load it from a CDN in your HTML:

```html
<script src="https://cdn.jsdelivr.net/npm/file2arraybuffer@latest/dist/file-to-arraybuffer.min.js"></script>
```

The UMD build exposes the global function as `fileToArrayBuffer` ("To", not "2").

## Usage

The function accepts any of these:

- a CSS selector string that points to an `<input type="file">`
- an `HTMLInputElement` of type `file`
- a `FileList`
- a `File` or `Blob`
- an `ArrayBuffer` (returned as is)

Reading a file is asynchronous, so the function returns a `Promise<ArrayBuffer>` instead of the buffer itself.

```html
<input id="attachment" type="file" />
<script type="text/javascript">

  const inputEl = document.getElementById('attachment')
  inputEl.addEventListener('change', async (ev) => {

    // Any of the following calls gives the same result:

    // a query selector
    const arrBuffer = await fileToArrayBuffer('#attachment')

    // the input element (must be of type "file")
    // const arrBuffer = await fileToArrayBuffer(ev.target)

    // the element's FileList (only the first file is converted)
    // const arrBuffer = await fileToArrayBuffer(ev.target.files)

    // a specific file from the FileList (useful for multi-file inputs)
    // const arrBuffer = await fileToArrayBuffer(ev.target.files[0])

    /* do stuff */
  })

  // or with a Blob you create yourself
  const myBlob = new Blob(['Hello, world'], { type: 'text/plain' })
  fileToArrayBuffer(myBlob).then((arrBuffer) => { /* do stuff */ })

</script>
```

The function converts one file per call. When you pass an `HTMLInputElement` or a `FileList`, it only reads `files[0]`. For a multi-file input, iterate over the `FileList`:

```html
<input id="attachments" type="file" multiple />
<script type="text/javascript">

  const input = document.getElementById('attachments')
  input.addEventListener('change', () => {
    const promises = Array.from(input.files).map((file) => fileToArrayBuffer(file))

    Promise.all(promises).then((arrBuffers) => {
      /* do stuff */
    })
  })

</script>
```

## Errors

The promise rejects with an `Error` when the input can't be converted: an empty value, a selector that matches nothing (or no DOM to query), an input that is not of type `file`, an empty `FileList`, or an unsupported type.

The function throws synchronously only when the environment lacks `Promise`, `ArrayBuffer` or `FileReader`.
