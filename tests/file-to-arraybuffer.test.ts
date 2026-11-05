/// <reference types="bun" />
import { afterEach, describe, expect, test } from 'bun:test';

import fileToArrayBuffer from '../src/file-to-arraybuffer';

// Swap a global for one test; restored in afterEach.
const restores: (() => void)[] = [];
function stubGlobal(name: string, value: unknown): void {
  const original = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
  restores.push(() => {
    if (original) Object.defineProperty(globalThis, name, original);
    else delete (globalThis as Record<string, unknown>)[name];
  });
}

function fileInput(files: File[] = []): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'file';
  // happy-dom's DataTransfer.files is a plain Array, but its FileList extends Array
  const list = new (FileList as unknown as new () => File[] & FileList)();
  list.push(...files);
  input.files = list;
  return input;
}

const text = (buf: ArrayBuffer): string => new TextDecoder().decode(buf);

afterEach(() => {
  while (restores.length) restores.pop()!();
  document.body.innerHTML = '';
});

describe('supported inputs', () => {
  test('ArrayBuffer resolves to the same instance', async () => {
    const buf = new ArrayBuffer(8);
    expect(await fileToArrayBuffer(buf)).toBe(buf);
  });

  test('Blob', async () => {
    expect(text(await fileToArrayBuffer(new Blob(['hello'])))).toBe('hello');
  });

  test('File', async () => {
    const result = await fileToArrayBuffer(new File(['dummy'], 'a.txt'));
    expect(result.byteLength).toBe(5);
    expect(text(result)).toBe('dummy');
  });

  test('empty File resolves to an empty ArrayBuffer', async () => {
    expect((await fileToArrayBuffer(new File([], 'empty.txt'))).byteLength).toBe(0);
  });

  test('FileList converts its first file', async () => {
    const { files } = fileInput([new File(['first'], '1.txt'), new File(['second'], '2.txt')]);
    expect(text(await fileToArrayBuffer(files!))).toBe('first');
  });

  test('HTMLInputElement converts its first file', async () => {
    expect(text(await fileToArrayBuffer(fileInput([new File(['abc'], 'a.txt')])))).toBe('abc');
  });

  test('CSS selector resolves to an input element', async () => {
    const input = fileInput([new File(['xyz'], 'a.txt')]);
    input.id = 'upload';
    document.body.appendChild(input);
    expect(text(await fileToArrayBuffer('#upload'))).toBe('xyz');
  });
});

describe('FileReader fallback (Blob without arrayBuffer)', () => {
  const legacyBlob = (content: string): Blob => {
    const blob = new Blob([content]);
    Object.defineProperty(blob, 'arrayBuffer', { value: undefined });
    return blob;
  };

  test('reads via FileReader', async () => {
    expect(text(await fileToArrayBuffer(legacyBlob('legacy')))).toBe('legacy');
  });

  test('rejects with the reader error', async () => {
    const readError = new Error('read failed');
    stubGlobal(
      'FileReader',
      class {
        public onerror: ((ev: unknown) => void) | null = null;
        public readAsArrayBuffer(): void {
          setTimeout(() => this.onerror?.({ target: { error: readError } }), 0);
        }
      },
    );
    await expect(fileToArrayBuffer(legacyBlob('x'))).rejects.toBe(readError);
  });

  test('throws synchronously when FileReader is missing', () => {
    stubGlobal('FileReader', undefined);
    expect(() => fileToArrayBuffer(legacyBlob('x'))).toThrow(TypeError);
  });
});

describe('rejections', () => {
  test.each([null, undefined, ''])('empty parameter: %p', async (value) => {
    // @ts-expect-error invalid input on purpose
    await expect(fileToArrayBuffer(value)).rejects.toThrow('Empty parameter');
  });

  test('selector not found', async () => {
    await expect(fileToArrayBuffer('#does-not-exist')).rejects.toThrow(
      'No HTML found with selector',
    );
  });

  test('selector without a DOM', async () => {
    stubGlobal('document', undefined);
    await expect(fileToArrayBuffer('#upload')).rejects.toThrow('does not support DOM selectors');
  });

  test('input that is not of type file', async () => {
    const input = document.createElement('input');
    // happy-dom returns an empty FileList here; real browsers return null
    Object.defineProperty(input, 'files', { value: null });
    await expect(fileToArrayBuffer(input)).rejects.toThrow('not of type "file"');
  });

  test('empty FileList', async () => {
    await expect(fileToArrayBuffer(fileInput().files!)).rejects.toThrow('FileList is empty');
  });

  test('input with no file selected', async () => {
    await expect(fileToArrayBuffer(fileInput())).rejects.toThrow('FileList is empty');
  });

  test('unsupported type', async () => {
    // @ts-expect-error invalid input on purpose
    await expect(fileToArrayBuffer({})).rejects.toThrow('Parameter type must be');
  });
});

describe('unsupported environments throw synchronously', () => {
  test.each(['Promise', 'ArrayBuffer'])('missing %s', (name) => {
    const blob = new Blob(['x']);
    stubGlobal(name, undefined);
    let error: unknown;
    try {
      fileToArrayBuffer(blob);
    } catch (e) {
      error = e;
    }
    restores.pop()!(); // restore before expect, which may need the global
    expect(error).toBeInstanceOf(ReferenceError);
  });
});
