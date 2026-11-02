import { Application, ImageSource } from '@nativescript/core'
import type { FilePickerAdapter, SelectedFile } from '@getcortexlabs/mavis-core'
import { ownNativeFile } from './file-access.js'

interface URLValue {
  path: string
  lastPathComponent: string
  pathExtension: string
}
interface ContentType {
  identifier: string
  preferredMIMEType?: string
}
interface Controller {
  presentedViewController?: Controller
  presentViewControllerAnimatedCompletion(
    controller: Controller,
    animated: boolean,
    completion: (() => void) | null,
  ): void
  dismissViewControllerAnimatedCompletion(animated: boolean, completion: (() => void) | null): void
}
interface Picker extends Controller {
  delegate: object | null
  allowsMultipleSelection: boolean
  presentationController?: { delegate: object | null }
}
interface ThumbnailRequest {}
interface ThumbnailGenerator {
  generateBestRepresentationForRequestCompletionHandler(
    request: ThumbnailRequest,
    completion: (representation: { UIImage: unknown } | null, error: unknown) => void,
  ): void
  cancelRequest(request: ThumbnailRequest): void
}
declare const NSObject: { extend(members: object, options: object): { new (): object } }
declare const UIDocumentPickerDelegate: unknown
declare const UIAdaptivePresentationControllerDelegate: unknown
declare const UIDocumentPickerViewController: {
  alloc(): { initForOpeningContentTypesAsCopy(types: ContentType[], asCopy: boolean): Picker }
}
declare const UTType: {
  typeWithMIMEType(type: string): ContentType | null
  typeWithFilenameExtension(extension: string): ContentType | null
  typeWithIdentifier(identifier: string): ContentType
}
declare const NSFileManager: {
  defaultManager: {
    attributesOfItemAtPathError(path: string): { objectForKey(name: string): unknown }
    removeItemAtURLError(url: URLValue): boolean
  }
}
declare const NSInputStream: { inputStreamWithURL(url: URLValue): { open(): void; close(): void } }
declare const QLThumbnailGenerationRequest: {
  alloc(): {
    initWithFileAtURLSizeScaleRepresentationTypes(
      url: URLValue,
      size: { width: number; height: number },
      scale: number,
      types: number,
    ): ThumbnailRequest
  }
}
declare const QLThumbnailGenerator: { sharedGenerator: ThumbnailGenerator }

const families: Readonly<Record<string, string>> = {
  'image/*': 'public.image',
  'video/*': 'public.movie',
  'audio/*': 'public.audio',
  'text/*': 'public.text',
}
interface PickerCallbacks {
  cancel(): void
  selected(urls: { count: number; objectAtIndex(index: number): URLValue }): void
}
const delegates = new WeakMap<object, PickerCallbacks>()
let Delegate: { new (): object } | undefined
function delegateClass() {
  Delegate ??= NSObject.extend(
    {
      documentPickerWasCancelled(this: object) {
        delegates.get(this)?.cancel()
      },
      presentationControllerDidDismiss(this: object) {
        delegates.get(this)?.cancel()
      },
      documentPickerDidPickDocumentsAtURLs(
        this: object,
        _controller: Picker,
        urls: { count: number; objectAtIndex(index: number): URLValue },
      ) {
        delegates.get(this)?.selected(urls)
      },
    },
    { protocols: [UIDocumentPickerDelegate, UIAdaptivePresentationControllerDelegate] },
  )
  return Delegate
}

export function createNativeFilePicker(): FilePickerAdapter {
  return {
    pick(request, cancellation) {
      if (cancellation.cancelled) return Promise.resolve(null)
      let presenter = Application.ios.rootController as Controller | undefined
      while (presenter?.presentedViewController) presenter = presenter.presentedViewController
      if (!presenter)
        return Promise.reject(new Error('File selection requires a mounted iOS view controller'))
      return new Promise((resolve, reject) => {
        let done = false
        let unsubscribe = () => {}
        let picker: Picker | undefined
        // UIKit delegates are weak. Keep this reference until the picker has finished.
        let delegate: object | undefined
        const finish = (files: readonly SelectedFile[] | null, error?: unknown) => {
          if (done) {
            for (const file of files ?? []) file.release()
            return
          }
          done = true
          unsubscribe()
          if (picker) {
            picker.delegate = null
            if (picker.presentationController) picker.presentationController.delegate = null
          }
          if (delegate) delegates.delete(delegate)
          delegate = undefined
          if (error) reject(error)
          else resolve(files)
        }
        try {
          const types = request.accept.map((hint) => {
            if (hint.startsWith('.')) return UTType.typeWithFilenameExtension(hint.slice(1))
            if (hint.endsWith('/*'))
              return families[hint] ? UTType.typeWithIdentifier(families[hint]) : null
            return UTType.typeWithMIMEType(hint)
          })
          const effective =
            !types.length || types.some((type) => !type)
              ? [UTType.typeWithIdentifier('public.data')]
              : (types as ContentType[])
          // Import a private temporary copy: no security-scoped bookmark or broad permission.
          picker = UIDocumentPickerViewController.alloc().initForOpeningContentTypesAsCopy(
            effective,
            true,
          )
          picker.allowsMultipleSelection = request.multiple
          const PickerDelegate = delegateClass()
          delegate = new PickerDelegate()
          delegates.set(delegate, {
            cancel() {
              finish(null)
            },
            selected(urls) {
              const files: SelectedFile[] = []
              try {
                for (let index = 0; index < urls.count; index++) {
                  const url = urls.objectAtIndex(index)
                  const attributes = NSFileManager.defaultManager.attributesOfItemAtPathError(
                    url.path,
                  )
                  const size = attributes?.objectForKey('NSFileSize')
                  let thumbnail: ThumbnailRequest | undefined
                  let released = false
                  const owner = ownNativeFile(
                    'ios',
                    url,
                    () => {
                      const stream = NSInputStream.inputStreamWithURL(url)
                      stream.open()
                      return { native: stream, close: () => stream.close() }
                    },
                    () => {
                      released = true
                      if (thumbnail) QLThumbnailGenerator.sharedGenerator.cancelRequest(thumbnail)
                      // asCopy=true guarantees that this is the imported sandbox copy.
                      NSFileManager.defaultManager.removeItemAtURLError(url)
                    },
                  )
                  files.push({
                    name: url.lastPathComponent,
                    size: size == null ? undefined : Number(size),
                    type:
                      UTType.typeWithFilenameExtension(url.pathExtension)?.preferredMIMEType ||
                      undefined,
                    ...owner,
                    preview() {
                      if (released) return Promise.resolve(undefined)
                      return new Promise((previewResolve, previewReject) => {
                        thumbnail =
                          QLThumbnailGenerationRequest.alloc().initWithFileAtURLSizeScaleRepresentationTypes(
                            url,
                            { width: 160, height: 160 },
                            1,
                            4,
                          )
                        QLThumbnailGenerator.sharedGenerator.generateBestRepresentationForRequestCompletionHandler(
                          thumbnail,
                          (representation, error) => {
                            thumbnail = undefined
                            if (released) previewResolve(undefined)
                            else if (representation)
                              previewResolve(new ImageSource(representation.UIImage))
                            else previewReject(error ?? new Error('Preview unavailable'))
                          },
                        )
                      })
                    },
                  })
                }
                finish(files)
              } catch (error) {
                for (const file of files) file.release()
                finish(null, error)
              }
            },
          })
          picker.delegate = delegate
          if (picker.presentationController) picker.presentationController.delegate = delegate
          unsubscribe = cancellation.onCancel(() => {
            picker?.dismissViewControllerAnimatedCompletion(true, null)
            finish(null)
          })
          presenter!.presentViewControllerAnimatedCompletion(picker, true, null)
        } catch (error) {
          finish(null, error)
        }
      })
    },
  }
}
