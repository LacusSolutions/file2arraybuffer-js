# file2arraybuffer

![NPM Latest Version](https://img.shields.io/npm/v/file2arraybuffer)
![Bundle Size](https://img.shields.io/bundlephobia/min/file2arraybuffer?label=bundle%20size)
![Downloads Count](https://img.shields.io/npm/dm/file2arraybuffer.svg)
![Test Status](https://img.shields.io/github/actions/workflow/status/LacusSolutions/file2arraybuffer-js/publish.yml?label=ci/cd)
![Last Update Date](https://img.shields.io/github/last-commit/LacusSolutions/file2arraybuffer-js)
![Project License](https://img.shields.io/github/license/LacusSolutions/file2arraybuffer-js)

Promise-based function to generate **ArrayBuffer** objects for files - commonly required by web services like the SharePoint REST API.

## Browser Support

![Chrome](https://raw.github.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png) | ![Firefox](https://raw.github.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png) | ![Safari](https://raw.github.com/alrra/browser-logos/master/src/safari/safari_48x48.png) | ![Opera](https://raw.github.com/alrra/browser-logos/master/src/opera/opera_48x48.png) | ![Edge](https://raw.github.com/alrra/browser-logos/master/src/edge/edge_48x48.png) | ![IE](https://raw.github.com/alrra/browser-logos/master/src/archive/internet-explorer_9-11/internet-explorer_9-11_48x48.png) |
--- | --- | --- | --- | --- | --- |
Latest ✔ | Latest ✔ | Latest ✔ | Latest ✔ | Latest ✔ | 11 ✔ |

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

// Common JS
const fileToArrayBuffer = require('file2arraybuffer')
```

or import it through your HTML file, using CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/file2arraybuffer@latest/dist/to-arraybuffer.min.js"></script>
```

**NOTE:** when used as UMD, global function will be available as `fileToArrayBuffer` ("To", not "2").

## Usage

You can use various parameter types to reference your HTML input element holding the file, as well as **Blob** instances you may generate on the fly. As the process of generating **ArrayBuffer** is computationally expense, the result is not the ArrayBuffer itself, but a promise to it, so consider asynchronous approach to work with that.

```html
<input id="attachment" type="file"  />
<script type="text/javascript">

  const inputEl = document.getElementById('attachment')
  inputEl.addEventListener('change', async (ev) => {

    // Use a query selector directly
    const arrBuffer = await fileToArrayBuffer('#attachment')

    // Use the HTML element directly (must be of type "file")
    const arrBuffer = await fileToArrayBuffer(ev.target)

    // Use the element attribute that stores the FileList (only the first one will be converted)
    const arrBuffer = await fileToArrayBuffer(ev.target.files)

    // Use the element specific file within the FileList (great if you have a multi-file input)
    const arrBuffer = await fileToArrayBuffer(ev.target.files[0])

    /* do stuff */
  })

  // or if you got a Blob object
  const myBlob = new Blob(['Hello, world'], { type: 'text/plain' })
  fileToArrayBuffer(myBlob).then((arrBuffer) => /* do stuff */)

</script>
```

However, keep in mind that the function handles one single file, so by referencing an **HTMLInputElement** or its **FileList** attribute will only generate the **ArrayBuffer** for the `el.files[0]`. If you are working with multi-file input, you must iterate over the **FileList** object.

```html
<input id="attachments" type="file" multiple="true" />
<script type="text/javascript">

  const input = document.getElementById("attachments")
  const promises = Array.from(input.files).map(fileToArrayBuffer)

  Promise.all(promises).then((arrBuffers) => {
    /* do stuff */
  })

</script>
```
