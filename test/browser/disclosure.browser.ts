import { expect, test, type Locator } from '@playwright/test'

async function aligned(marker: Locator, option: Locator) {
  await expect
    .poll(async () => {
      const a = await marker.boundingBox(),
        b = await option.boundingBox()
      return a && b
        ? Math.max(Math.abs(a.x - b.x), Math.abs(a.width - b.width), Math.abs(a.height - b.height))
        : 1000
    })
    .toBeLessThan(1.1)
}

test('Accordion keeps requests controlled, supports multiple and disabled headers', async ({
  page,
}) => {
  await page.goto('/playground/#/checks/disclosure')
  const number = page.getByRole('button', { name: 'Number zero', exact: true })
  const string = page.getByRole('button', { name: 'String zero', exact: true })
  await expect(number).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('button', { name: 'Unavailable', exact: true })).toBeDisabled()
  await page.getByRole('switch', { name: 'Accept requests' }).click()
  await string.click()
  await expect(number).toHaveAttribute('aria-expanded', 'true')
  await expect(string).toHaveAttribute('aria-expanded', 'false')
  await page.getByRole('switch', { name: 'Accept requests' }).click()
  await string.click()
  await expect(page.getByText('number body 0', { exact: true })).toHaveCount(0)
  await expect(page.getByText('string body 0', { exact: true })).toBeVisible()
  await page.getByRole('switch', { name: 'Multiple sections' }).click()
  await number.click()
  await expect(string).toHaveAttribute('aria-expanded', 'true')
  await expect(number).toHaveAttribute('aria-expanded', 'true')
  await page.getByRole('switch', { name: 'Disable controls' }).click()
  await expect(number).toBeDisabled()
  await expect(page.getByRole('textbox', { name: 'Note number 0' })).toBeEnabled()
})

test('Accordion arrows skip disabled headers and closing/removing a focused body repairs focus', async ({
  page,
}) => {
  await page.goto('/playground/#/checks/disclosure')
  const number = page.getByRole('button', { name: 'Number zero', exact: true })
  await number.focus()
  await number.press('ArrowUp')
  await expect(page.getByRole('button', { name: 'Last section', exact: true })).toBeFocused()
  await page.keyboard.press('ArrowUp')
  await expect(page.getByRole('button', { name: 'String zero', exact: true })).toBeFocused()
  await page.keyboard.press('Home')
  await expect(number).toBeFocused()
  await page.getByRole('button', { name: 'Close inside' }).focus()
  await page.keyboard.press('Enter')
  await expect(number).toBeFocused()
  await expect(page.getByRole('textbox', { name: 'Note number 0' })).toHaveCount(0)
  await number.press('Space')
  await page.getByRole('button', { name: 'Remove number inside' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: 'String zero', exact: true })).toBeFocused()
  await expect(number).toHaveCount(0)
})

test('SegmentedControl follows radio keyboard selection and aligns its marker in LTR/RTL', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/playground/#/checks/disclosure')
  const group = page.getByRole('radiogroup', { name: 'Test segments' })
  const marker = group.locator('.m-segmented-marker')
  const number = group.getByRole('radio', { name: 'Number zero', exact: true })
  await aligned(marker, number)
  await number.focus()
  await page.keyboard.press('ArrowRight')
  const string = group.getByRole('radio', { name: 'String zero', exact: true })
  await expect(string).toBeFocused()
  await expect(string).toHaveAttribute('aria-checked', 'true')
  await page.keyboard.press('ArrowRight')
  const last = group.getByRole('radio', { name: 'Last section', exact: true })
  await expect(last).toBeFocused()
  await aligned(marker, last)
  await page.keyboard.press('Home')
  await expect(number).toHaveAttribute('aria-checked', 'true')
  await group.evaluate((el) => {
    el.setAttribute('dir', 'rtl')
  })
  await aligned(marker, number)
  await page.keyboard.press('ArrowLeft')
  await expect(string).toBeFocused()
  await aligned(marker, string)
  await page.keyboard.press('End')
  await aligned(marker, last)
  expect(await group.locator('[tabindex="0"]').count()).toBe(1)
  await expect(marker).toHaveCSS('transition-duration', '0s')
})

test('SegmentedControl rejects changes, preserves missing values and repairs removed focus', async ({
  page,
}) => {
  await page.goto('/playground/#/checks/disclosure')
  const group = page.getByRole('radiogroup', { name: 'Test segments' })
  const number = group.getByRole('radio', { name: 'Number zero', exact: true })
  await page.getByRole('switch', { name: 'Accept requests' }).click()
  await group.getByRole('radio', { name: 'String zero', exact: true }).click()
  await expect(number).toHaveAttribute('aria-checked', 'true')
  await expect(page.locator('#selection')).toHaveText('number:0')
  await number.focus()
  await page
    .getByRole('button', { name: 'Remove number', exact: true })
    .evaluate((el) => (el as HTMLButtonElement).click())
  await expect(group.getByRole('radio', { name: 'String zero', exact: true })).toBeFocused()
  await expect(group.locator('[aria-checked="true"]')).toHaveCount(0)
  await expect(page.locator('#selection')).toHaveText('number:0')
  await expect(group.locator('.m-segmented-marker')).toBeHidden()
  await page.getByRole('switch', { name: 'Accept requests' }).click()
  await group.getByRole('radio', { name: 'Last section', exact: true }).click()
  await page.getByRole('button', { name: 'Reverse items' }).click()
  await aligned(
    group.locator('.m-segmented-marker'),
    group.getByRole('radio', { name: 'Last section', exact: true }),
  )
  await page.getByRole('button', { name: 'Clear values' }).click()
  await expect(group.locator('[aria-checked="true"]')).toHaveCount(0)
  await page.getByRole('switch', { name: 'Disable controls' }).click()
  for (const radio of await group.getByRole('radio').all()) await expect(radio).toBeDisabled()
})

for (const component of ['accordion', 'segmented-control']) {
  test(`${component} stays contained in narrow layouts and both themes`, async ({ page }, info) => {
    await page.goto(`/playground/#/components/${component}`)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const demo = page.locator(component === 'accordion' ? '#accordion-demo' : '#segmented-demo')
    for (const theme of ['mavis', 'midnight']) {
      for (const width of [320, 390, 1440]) {
        await page.setViewportSize({ width, height: 1100 })
        await demo.scrollIntoViewIfNeeded()
        expect(
          await page.getByRole('main').evaluate((el) => el.scrollWidth <= el.clientWidth),
        ).toBe(true)
        const outside = await demo.evaluate((root) => {
          const outer = root.getBoundingClientRect()
          return [...root.querySelectorAll('button')].some((el) => {
            const r = el.getBoundingClientRect()
            return (
              r.left < outer.left - 1 ||
              r.right > outer.right + 1 ||
              el.scrollWidth > el.clientWidth + 1
            )
          })
        })
        expect(outside).toBe(false)
        await page.screenshot({ path: info.outputPath(`${component}-${theme}-${width}.png`) })
      }
      if (theme === 'mavis') await page.getByRole('button', { name: 'Trocar tema' }).click()
    }
  })
}

test('Help Center preserves expanded answers and feedback per topic across themes', async ({
  page,
}, info) => {
  await page.goto('/playground/#/showcase/help')
  await expect(page.getByRole('heading', { name: 'Um atalho para continuar.' })).toBeVisible()
  await page.getByRole('button', { name: 'Foi útil', exact: true }).click()
  await page.getByRole('radio', { name: 'Planos', exact: true }).click()
  await page
    .getByRole('button', { name: 'Posso experimentar antes de escolher?', exact: true })
    .click()
  await expect(
    page.getByText('Pode explorar todos os exemplos do catálogo.', { exact: false }),
  ).toBeVisible()
  await page.getByRole('radio', { name: 'Conta', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Obrigado pelo retorno', exact: true }),
  ).toBeDisabled()
  await page.getByRole('button', { name: 'Trocar tema' }).click()
  await expect(
    page.getByRole('button', { name: 'Como deixo o perfil com a minha cara?', exact: true }),
  ).toHaveAttribute('aria-expanded', 'true')
  await page.getByRole('radio', { name: 'Planos', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Posso experimentar antes de escolher?', exact: true }),
  ).toHaveAttribute('aria-expanded', 'true')
  await page.getByRole('button', { name: 'Quero conversar', exact: true }).click()
  await expect(page.getByText('Este é um espaço de demonstração.', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Fechar informação de atendimento', exact: true }).click()
  await expect(page.getByText('Este é um espaço de demonstração.', { exact: true })).toHaveCount(0)
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 1100 })
    await page.getByRole('main').evaluate((el) => {
      el.scrollTop = 0
    })
    expect(await page.getByRole('main').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
      true,
    )
    await page.screenshot({ path: info.outputPath(`help-midnight-${width}.png`) })
  }
})

test('long labels and doubled text retain equal-width segments without clipping', async ({
  page,
}) => {
  await page.goto('/playground/#/checks/disclosure')
  await page.setViewportSize({ width: 320, height: 1000 })
  await page.addStyleTag({
    content: '.m-segmented-option, .m-accordion-trigger {font-size: 36px !important} ',
  })
  const group = page.getByRole('radiogroup', { name: 'Test segments' })
  const sizes = await group.getByRole('radio').evaluateAll((els) =>
    els.map((el) => ({
      width: el.getBoundingClientRect().width,
      clipped: el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1,
    })),
  )
  expect(sizes.every((size) => !size.clipped && Math.abs(size.width - sizes[0]!.width) < 1)).toBe(
    true,
  )
  expect(await page.getByRole('main').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
})
