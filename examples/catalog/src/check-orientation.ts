import { Application, isIOS } from '@nativescript/core'

export function rotate(landscape: boolean) {
  if (isIOS) {
    const preferences = UIWindowSceneGeometryPreferencesIOS.alloc().initWithInterfaceOrientations(
      landscape ? 24 : 2,
    )
    Application.ios.window.windowScene!.requestGeometryUpdateWithPreferencesErrorHandler(
      preferences,
      (error: { localizedDescription: string }) => console.error(error.localizedDescription),
    )
  } else Application.android.foregroundActivity.setRequestedOrientation(landscape ? 0 : 1)
}
