import { Page, test as base } from '@playwright/test'
import { BE_URL, PASSWORD, SERVICE_URL, USERNAME } from '../../config/env-data'
import { ENDPOINTS } from '../../utils/endpoints'
import { fakeJwt } from '../../utils/jwt'
import { LoginPage } from '../pages/login-page'
import { OrderPage } from '../pages/order-page'
import { OrderDetailsPage } from '../pages/order-details-page'
import { NotFoundPage } from '../pages/order-not-found-page'

type Fixtures = {
  auth: { jwt: string }
  orderId: string
  mainPage: Page
  loginPage: Page
  Login: LoginPage
  Orders: OrderPage
  OrderDetails: OrderDetailsPage
  OrderNotFound: NotFoundPage
}

export const test = base.extend<Fixtures>({
  auth: async ({ request }, use) => {
    console.log('Init: getting jwt')
    const response = await request.post(`${BE_URL}${ENDPOINTS.STUDENTS}`, {
      data: {
        username: `${USERNAME}`,
        password: `${PASSWORD}`,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const jwt = await response.text()

    await use({ jwt })
  },

  orderId: async ({ auth, request }, use) => {
    const response = await request.post(`${BE_URL}${ENDPOINTS.ORDERS}`, {
      data: {
        status: 'OPEN',
        customerName: 'test',
        customerPhone: 'test',
        comment: 'test',
      },
      headers: {
        Authorization: `Bearer ${auth.jwt}`,
      },
    })

    const responseData = await response.json()
    const orderId = responseData.id
    console.log('order created with id: ', orderId)
    await use(orderId)
  },

  mainPage: async ({ context, auth }, use) => {
    await context.addInitScript((token) => {
      localStorage.setItem('jwt', token)
    }, auth.jwt)

    const mainPage = await context.newPage()

    await mainPage.route(`**${ENDPOINTS.ORDERS}`, async (route) => {
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

    await mainPage.goto(SERVICE_URL)
    await use(mainPage)
  },

  loginPage: async ({ context }, use) => {
    const loginPage = await context.newPage()

    await loginPage.route(`**${ENDPOINTS.STUDENTS}`, async (route) => {
      await route.fulfill({ body: fakeJwt() })
    })

    await loginPage.goto(SERVICE_URL)
    await use(loginPage)
  },

  Login: async ({ loginPage }, use) => {
    const Login = new LoginPage(loginPage)
    await use(Login)
  },

  Orders: async ({ mainPage }, use) => {
    const Orders = new OrderPage(mainPage)
    await use(Orders)
  },

  OrderDetails: async ({ mainPage }, use) => {
    const OrderDetails = new OrderDetailsPage(mainPage)
    await use(OrderDetails)
  },

  OrderNotFound: async ({ mainPage }, use) => {
    const OrderNotFound = new NotFoundPage(mainPage)
    await use(OrderNotFound)
  },
})

export { expect } from '@playwright/test'
