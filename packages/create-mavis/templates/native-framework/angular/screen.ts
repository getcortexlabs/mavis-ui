import '@angular/compiler'
import { Component, signal, ViewChild } from '@angular/core'
import {
  NativeScriptCommonModule,
  bootstrapApplication,
  runNativeScriptAngularApp,
} from '@nativescript/angular'
import { MAVIS_COMPONENTS, MInput } from '@getcortexlabs/mavis-angular-nativescript'
import { bridge, initial, theme, isolatedTheme, surface } from './model'

@Component({
  selector: 'adapter-catalog',
  standalone: true,
  imports: [NativeScriptCommonModule, ...MAVIS_COMPONENTS],
  template: `<Page actionBarHidden="true">
    <MColumn
      id="catalog"
      gap="md"
      padding="lg"
      height="100%"
      [backgroundColor]="background()"
      [theme]="theme"
    >
      <MText id="heading" text="__MAVIS_NAME__" variant="title" [theme]="theme" />
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
      <MBox padding="md" radius="md" [backgroundColor]="isolated.theme.colors.background"
        ><MText id="isolated" text="Independent theme" [theme]="isolated"
      /></MBox>
    </MColumn>
  </Page>`,
})
class Catalog {
  @ViewChild(MInput) input?: MInput
  background = signal(theme.theme.colors.background)
  private offTheme = theme.subscribe(() => this.background.set(theme.theme.colors.background))
  ngOnDestroy() {
    this.offTheme()
  }
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
