import '@angular/compiler'
import { Component, signal, ViewChild } from '@angular/core'
import {
  NativeScriptCommonModule,
  bootstrapApplication,
  runNativeScriptAngularApp,
} from '@nativescript/angular'
import { MAVIS_COMPONENTS, MInput } from '@getcortexlabs/mavis/angular'
import { bridge, initial, theme, isolatedTheme, surface } from './_model'

@Component({
  selector: 'adapter-catalog',
  standalone: true,
  imports: [NativeScriptCommonModule, ...MAVIS_COMPONENTS],
  template: `<Page actionBarHidden="true">
    <MColumn id="catalog" gap="md" padding="lg" [theme]="theme">
      <MText id="heading" text="Direct NativeScript / Angular" variant="title" [theme]="theme" />
      <MRow id="row" gap="sm"
        ><MButton
          id="action"
          [theme]="theme"
          [text]="'Count ' + state().count"
          [disabled]="state().disabled"
          [loading]="state().loading"
          (click)="update({ count: state().count + 1 })"
      /></MRow>
      <MInput
        id="editor"
        label="Name"
        [theme]="theme"
        [modelValue]="state().value"
        [disabled]="state().disabled"
        (modelValueChange)="update({ value: $event })"
      />
      @if (state().visible) {
        <MBox
          id="motion"
          [width]="100"
          [height]="30"
          backgroundColor="#4f46e5"
          [motionSurface]="surface"
        />
      }
      <MText id="isolated" text="Independent theme" [theme]="isolated" />
    </MColumn>
  </Page>`,
})
class Catalog {
  @ViewChild(MInput) input?: MInput
  state = signal({ ...initial })
  theme = theme
  isolated = isolatedTheme
  surface = surface
  update = (patch: Partial<typeof initial>) =>
    this.state.update((value) => ({ ...value, ...patch }))
  constructor() {
    bridge.read = this.state
    bridge.update = this.update
    bridge.focus = () => this.input?.focusInput()
  }
}
export function start() {
  runNativeScriptAngularApp({
    appModuleBootstrap: async () => {
      const app = await bootstrapApplication(Catalog)
      bridge.dispose = () => app.destroy()
      return app
    },
  })
}
