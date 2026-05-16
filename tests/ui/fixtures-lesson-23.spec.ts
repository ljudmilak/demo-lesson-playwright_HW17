import { test } from '../fixtures/delivery.fixture'
import { ENDPOINTS } from '../../utils/endpoints'
import { PASSWORD, USERNAME } from '../../config/env-data'

test.describe('Mocked order flows with fixtures', () => {
  test('Order creation with fixture', async ({ Orders }) => {
    await Orders.createOrder()
    await Orders.checkSuccessfullyCreatedPopup()
  })

  test('Successful login', async ({ Login }) => {
    await Login.checkInnerComponents()
    const orderPage = await Login.signIn(USERNAME, PASSWORD)
    await orderPage.checkInnerComponents()
  })

  test('Order search - found', async ({ mainPage, Orders }) => {
    await mainPage.route(`**${ENDPOINTS.ORDERS}/*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'OPEN',
          courierId: null,
          customerName: 'name',
          customerPhone: '12345678',
          comment: 'comment',
          id: 9999,
        }),
      })
    })

    const detailsPage = await Orders.checkOrderFound(9999)
    await detailsPage.checkVisible(true)
  })

  test('Order search - not found', async ({ mainPage, Orders, OrderNotFound }) => {
    await mainPage.route(`**${ENDPOINTS.ORDERS}/*`, async (route) => {
      await route.fulfill({
        status: 200,
      })
    })

    await Orders.checkOrderNotFound()
    await OrderNotFound.checkVisible(true)
  })

  test('Server error on order search', async ({ mainPage, Orders, OrderNotFound }) => {
    await mainPage.route(`**${ENDPOINTS.ORDERS}/*`, async (route) => {
      await route.fulfill({
        status: 500,
      })
    })

    await Orders.checkOrderNotFound()
    await OrderNotFound.checkVisible(true)
  })
})
