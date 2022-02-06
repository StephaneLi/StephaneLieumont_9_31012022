/**
 * @jest-environment jsdom
 */
import { screen, waitFor } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import mockStore from '../__mocks__/store'
import { bills } from '../fixtures/bills'
import { localStorageMock } from '../__mocks__/localStorage'
import { ROUTES, ROUTES_PATH } from '../constants/routes'
import Router from '../app/Router'
import BillsUI from '../views/BillsUI'
import BillsContainer from '../containers/Bills'

jest.mock('../app/store', () => mockStore)

describe('Given I am connected as an employee', () => {
  describe('When I am on Bills Page, bills are loading', () => {
    test('Then loading page should be rendered', () => {
      const html = BillsUI({ loading: true })
      document.body.innerHTML = html
      expect(screen.getAllByText('Loading...')).toBeTruthy()
    })
  })
  describe('When I am on Bills Page, but error to get bills', () => {
    test('Then Error page should be render', () => {
      const html = BillsUI({loading: false, error: true})
      document.body.innerHTML = html

      const ErrorPage = screen.getByTestId('error-message')
      expect(ErrorPage).toBeTruthy()
    })
  })
  describe('When I am on Bills Page', () => {
    test('Then bills should be ordered from earliest to latest', () => {
      // Array Sort Bills By Date DESC
      const html = BillsUI({ data: bills.sort((a, b) => new Date(b.date) - new Date(a.date)) })
      document.body.innerHTML = html
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    test('Then bill icon in vertical layout should be highlighted', () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      Object.defineProperty(window, 'location', { value: { hash: ROUTES_PATH['Bills'] } })

      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      document.body.innerHTML = `<div id="root"></div>`    

      Router()
      const icon = screen.getByTestId('icon-window')
      expect(icon.className).toBe('active-icon')
    })
  })

  describe('When I am on Bills Page and click on new Bills', () => {
    test('Then editable form new bill appears', () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
   
      const html = BillsUI({ data: bills.sort((a, b) => new Date(b.date) - new Date(a.date)) })
      document.body.innerHTML = html

      const billsContainer = new BillsContainer({
        document, onNavigate, store: mockStore, localStorage: window.localStorage
      })
  
      const handleShowModalNewBill = jest.fn((e) => billsContainer.handleClickNewBill(e))
      const btnNewBill = screen.getByTestId('btn-new-bill')
  
      btnNewBill.addEventListener('click', handleShowModalNewBill)
      userEvent.click(btnNewBill)
      expect(handleShowModalNewBill).toHaveBeenCalled()
      expect(screen.getAllByText('Envoyer une note de frais')).toBeTruthy()
    })
  })

  describe('When I am on Bills Page and i click on icon Eye of bill', () => {
    test('Then modal with supporting documents appears', () => {
      $.fn.modal = jest.fn()// Prevent jQuery error
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
    
      const html = BillsUI({ data: bills.sort((a, b) => new Date(b.date) - new Date(a.date)) })
      document.body.innerHTML = html

      const billsContainer = new BillsContainer({
        document, onNavigate, store: mockStore, localStorage: window.localStorage
      })
  
      const iconEye = screen.getAllByTestId('icon-eye')[0]
      const handleShowModalFile = jest.fn((e) => { billsContainer.handleClickIconEye(e.target) })
  
      iconEye.addEventListener('click', handleShowModalFile)
      userEvent.click(iconEye)
  
      expect(handleShowModalFile).toHaveBeenCalled()
      expect(screen.getAllByText('Justificatif')).toBeTruthy()
    })  
  })

  describe('When I am on Bills Page but there are a bill with date corrupted data', () => {
    test('Then it should appear without formatted date', async () => {
      jest.spyOn(mockStore, 'bills')  
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

// Test d'integration GET
describe('Given I am connected as an employee', () => {
  describe('When I am on Bills Page', () => {
    test('fetches bills from mock API GET', async () => {   
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      Object.defineProperty(window, 'location', { value: { hash: ROUTES_PATH['Bills'] } })
  
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      document.body.innerHTML = `<div id="root"></div>`  
      Router()
      window.onNavigate(ROUTES_PATH.Bills)
      
      expect(await waitFor(() => screen.getByText('Mes notes de frais'))).toBeTruthy()
      expect(await waitFor(() => screen.getByTestId('tbody'))).toBeTruthy()
      expect(screen.getAllByText('encore'))
    })
  })
  describe('When an error occurs on API', () => {
    beforeEach(() => {
      jest.spyOn(mockStore, 'bills')
      Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
      )
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: 'a@a'}))
      document.body.innerHTML = `<div id="root"></div>`  
      Router()
    })

    test('fetches bills from an API and fails with 404 message error', async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error('Erreur 404'))
          }
        }})
      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick)
      const message = await waitFor(() => screen.getByText(/Erreur 404/))
      expect(message).toBeTruthy()
    })

    test('fetches messages from an API and fails with 500 message error', async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error('Erreur 500'))
          }
        }})

      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick)
      const message = await waitFor(() => screen.getByText(/Erreur 500/))
      expect(message).toBeTruthy()
    })
  })
})

