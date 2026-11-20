import { Application } from '@nativescript/core'
import { start } from './screen'
import { bridge } from './model'
Application.on(Application.exitEvent, () => bridge.dispose?.())
start()
