/**
 * @jest-environment jsdom
 */
import { screen, waitFor } from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import mockStore from "../__mocks__/store"
import { bills } from "../fixtures/bills.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js"
import Router from "../app/Router.js"
import BillsUI from "../views/BillsUI.js"
import BillsContainer from "../containers/Bills.js"

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    beforeEach(() => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      Object.defineProperty(window, 'location', { value: { hash: ROUTES_PATH['Bills'] } })

      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      document.body.innerHTML = `<div id="root"></div>`      
    })

    test("Then bill icon in vertical layout should be highlighted", () => {
      Router() 

      const icon = screen.getByTestId('icon-window')
      expect(icon.className).toBe('active-icon')
    })

    test("Then, User bills list should appears", async () => {     
      Router()
      window.onNavigate(ROUTES_PATH.Bills)
      
      const contentTitle = await waitFor(() => screen.getByText('Mes notes de frais'))
      expect(contentTitle).toBeTruthy()
      const billsTable = await waitFor(() => screen.getByTestId('tbody'))
      expect(billsTable).toBeTruthy()
    })

    test("Then bills should be ordered from earliest to latest", () => {
      // Array Sort Bills By Date DESC
      const html = BillsUI({ data: bills.sort((a, b) => new Date(b.date) - new Date(a.date)) })
      document.body.innerHTML = html
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    test("Then if Error loading bills, there are an Error Page", () => {
      const html = BillsUI({loading: false, error: true})
      document.body.innerHTML = html

      console.log(document.body.innerHTML)
      const ErrorPage = screen.getByTestId('error-message')
      expect(ErrorPage).toBeTruthy()
    })
  })

  describe("When I am on Bills Page and click on new Bills", () => {
    test("Then editable form new bill appears", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
  
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
  
      const billsContainer = new BillsContainer({
        document, onNavigate, store: null, localStorage: window.localStorage
      })
  
      const html = BillsUI({ data: bills.sort((a, b) => new Date(b.date) - new Date(a.date)) })
      document.body.innerHTML = html
  
      const handleShowModalNewBill = jest.fn((e) => billsContainer.handleClickNewBill(e))
      const btnNewBill = screen.getByTestId('btn-new-bill')
  
      btnNewBill.addEventListener('click', handleShowModalNewBill)
      userEvent.click(btnNewBill)
      expect(handleShowModalNewBill).toHaveBeenCalled()
      expect(screen.getAllByText('Envoyer une note de frais')).toBeTruthy()
    })
  })

  describe("When I am on Bills Page and i click on icon Eye of bill", () => {
    test("Then modal with supporting documents appears", () => {
      $.fn.modal = jest.fn()// Prevent jQuery error
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
  
      const billsContainer = new BillsContainer({
        document, onNavigate, store: null, localStorage: window.localStorage
      })
  
      const html = BillsUI({ data: bills.sort((a, b) => new Date(b.date) - new Date(a.date)) })
      document.body.innerHTML = html
  
      const iconEye = screen.getAllByTestId('icon-eye')[0]
      const handleShowModalFile = jest.fn((e) => { billsContainer.handleClickIconEye(e.target) })
  
      iconEye.addEventListener('click', handleShowModalFile)
      userEvent.click(iconEye)
  
      expect(handleShowModalFile).toHaveBeenCalled()
      expect(screen.getAllByText('Justificatif')).toBeTruthy()
    })  
  })

  describe("When I am on Bills Page but there are a bill with date corrupted data", () => {
    test('Then it should appear without formatted date', async () => {
      jest.spyOn(mockStore, "bills")  
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      Object.defineProperty(window, 'location', { value: { hash: ROUTES_PATH['Bills'] } })

      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: 'a@a' }))
      document.body.innerHTML = `<div id="root"></div>`  
      Router()

      // Modify first entrie of list bills on mockStore 
      const billsMock = await mockStore.bills().list()
      const corruptedBills = [{... billsMock[0]}]
      corruptedBills[0].date = '3000-56/85'
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () => {
            return Promise.resolve(corruptedBills)
          }
        }
      })            
      
      window.onNavigate(ROUTES_PATH.Bills)
      
      const contentBillDate = await waitFor(() => screen.getByText('3000-56/85'))
      expect(contentBillDate).toBeTruthy()
    })
  })
})

