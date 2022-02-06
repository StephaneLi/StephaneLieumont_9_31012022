/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import mockStore from '../__mocks__/store'
import { localStorageMock } from '../__mocks__/localStorage'
import { ROUTES, ROUTES_PATH } from '../constants/routes'
import NewBillUI from '../views/NewBillUI'
import NewBill from '../containers/NewBill'
import Router from '../app/Router'

jest.mock('../app/store', () => mockStore)

describe('Given I am connected as an employee', () => {
  describe('When I am on NewBill Page', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      Object.defineProperty(window, 'location', { value: { hash: ROUTES_PATH['NewBill'] } })

      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      document.body.innerHTML = `<div id="root"></div>`
      Router()      
    })

    test('Then mail icon in vertical layout should be highlighted', () => {
      const icon = screen.getByTestId('icon-mail')
      expect(icon.className).toBe('active-icon')
    })

    test('Then there are a form to edit new bill', () => {
      const html = NewBillUI({})
      document.body.innerHTML = html
      const contentTitle = screen.getAllByText('Envoyer une note de frais')
      expect(contentTitle).toBeTruthy
    })
  })

  describe('When I am on NewBill Page ans i click on button change file', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      Object.defineProperty(window, 'location', { value: { hash: ROUTES_PATH['NewBill'] } })

      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      document.body.innerHTML = `<div id="root"></div>`
      Router()
    })

    afterAll(() => {      
      console.error.mockRestore()
    })

    test('Then i can choose file with good extension (jpg|jpeg|png)', async () => {
      const newBill = new NewBill({document,  onNavigate, store: mockStore, localStorage: window.localStorage})
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))
      const inputFile = screen.getByTestId('file')

      const img = new File(['img'], 'image.png', {type:'image/png'})
      
      inputFile.addEventListener('change', handleChangeFile)      
      await waitFor(() => { userEvent.upload(inputFile, img) })
     
      expect(inputFile.files[0].name).toBe('image.png')
      expect(handleChangeFile).toBeCalled()
      expect(newBill.validFile).toBeTruthy()
    })

    test('Then i can choose file with bad extension', async () => {
      const newBill = new NewBill({document,  onNavigate, store: mockStore, localStorage: window.localStorage})
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))
      const inputFile = screen.getByTestId('file')

      const txt = new File(['Welcome to Websparrow.org.'], 'image.txt', { type: 'text/plaincharset=utf-8' })

      inputFile.addEventListener('change', handleChangeFile)
      await waitFor(() => { userEvent.upload(inputFile, txt) }) 

      expect(inputFile.files[0].name).toBe('image.txt')
      expect(handleChangeFile).toBeCalled()
      expect(newBill.validFile).not.toBeTruthy()
    })

    test('Then i can choose file but there are an error server 500', async () => {
      jest.spyOn(mockStore, 'bills')
      jest.spyOn(console, 'error').mockImplementation(() => {})// Prevent Console.error jest error
      
      mockStore.bills.mockImplementationOnce(() => {
        return {
          create : jest.fn().mockRejectedValueOnce(false)
        }
      })

      const newBill = new NewBill({document,  onNavigate, store: mockStore, localStorage:null})
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))
      const inputFile = screen.getByTestId('file')

      const img = new File(['img'], 'image.png', {type:'image/png'})
      let validFile

      inputFile.addEventListener('change', (e) => {
        validFile = handleChangeFile(e)
      })
      await waitFor(() => { userEvent.upload(inputFile, img) }) 

      expect(handleChangeFile).toBeCalled()
      expect(inputFile.files[0].name).toBe('image.png')

      expect(validFile).not.toBeTruthy()
    })
  })

  describe('When I do fill fields in correct format and I click on submit button', () => {
    test('Then I should post new Bill ticket', async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      Object.defineProperty(window, 'location', { value: { hash: ROUTES_PATH['NewBill'] } })

      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      document.body.innerHTML = `<div id="root"></div>`
      Router()
      // we have to mock navigation to test it
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const newBill = new NewBill({document,  onNavigate, store: mockStore, localStorage: window.localStorage})

      // Define inputs values
      const inputData = {
        type: 'Transports',
        name:  'Vol Toulouse Corse',
        amount: '174',
        date:  '2022-02-22',
        vat: 70,
        pct: 20,
        file: new File(['img'], 'image.png', {type:'image/png'}),
        commentary: 'Note de deplacement professionnel',
        status: 'pending'
      }

      // Get Inputs HTMLElement
      const inputType = screen.getByTestId('expense-type')
      const inputName = screen.getByTestId('expense-name')
      const inputDate = screen.getByTestId('datepicker')
      const inputAmmount = screen.getByTestId('amount')
      const inputVat = screen.getByTestId('vat')
      const inputPct = screen.getByTestId('pct')
      const inputComment= screen.getByTestId('commentary')
      const inputFile = screen.getByTestId('file')
      const form = screen.getByTestId('form-new-bill')

      // Edit input HTML
      fireEvent.change(inputType, { target: { value: inputData.type } })
      fireEvent.change(inputName, { target: { value: inputData.name } })
      fireEvent.change(inputDate, { target: { value: inputData.date } })
      fireEvent.change(inputAmmount, { target: { value: inputData.amount } })
      fireEvent.change(inputVat, { target: { value: inputData.vat } })
      fireEvent.change(inputPct, { target: { value: inputData.pct } })
      fireEvent.change(inputComment, { target: { value: inputData.commentary } })
      
    
      // Submit form
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
      form.addEventListener('submit', handleSubmit)

      await waitFor(() => { userEvent.upload(inputFile, inputData.file) })
      fireEvent.submit(form)

      // check function called
      expect(handleSubmit).toHaveBeenCalled()

      // Verify input validity
      expect(inputType.validity.valid).toBeTruthy()
      expect(inputName.validity.valid).toBeTruthy()
      expect(inputDate.validity.valid).toBeTruthy()
      expect(inputAmmount.validity.valid).toBeTruthy()
      expect(inputVat.validity.valid).toBeTruthy()
      expect(inputPct.validity.valid).toBeTruthy()
      expect(inputComment.validity.valid).toBeTruthy()
      expect(inputFile.files[0]).toBeDefined()
    })

    test('Then it should be render Bills Page', () => {
      expect(screen.getAllByText('Mes notes de frais')).toBeTruthy()
    })
  })

  describe('When I do fill fields in incorrect format and I click on submit button', () => {
    test('Then I should have an error HTML validator form', async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      Object.defineProperty(window, 'location', { value: { hash: ROUTES_PATH['NewBill'] } })

      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      document.body.innerHTML = `<div id="root"></div>`
      Router()

      // we have to mock navigation to test it
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const newBill = new NewBill({document,  onNavigate, store: mockStore, localStorage: window.localStorage})

      // Define inputs values
      const inputData = {
        type: 'test',
        name:  'Vol Toulouse Corse',
        amount: 'test',
        date:  'test incorrect date',
        vat: 70,
        pct: 'test',
        file: new File(['img'], 'image.png', {type:'image/png'}),
        commentary: 'Note de deplacement professionnel',
        status: 'pending'
      }

      // Get Inputs HTMLElement
      const inputType = screen.getByTestId('expense-type')
      const inputName = screen.getByTestId('expense-name')
      const inputDate = screen.getByTestId('datepicker')
      const inputAmmount = screen.getByTestId('amount')
      const inputVat = screen.getByTestId('vat')
      const inputPct = screen.getByTestId('pct')
      const inputComment= screen.getByTestId('commentary')
      const inputFile = screen.getByTestId('file')
      const form = screen.getByTestId('form-new-bill')

      // Edit input HTML
      fireEvent.change(inputType, { target: { value: inputData.type } })
      fireEvent.change(inputName, { target: { value: inputData.name } })
      fireEvent.change(inputDate, { target: { value: inputData.date } })
      fireEvent.change(inputAmmount, { target: { value: inputData.amount } })
      fireEvent.change(inputVat, { target: { value: inputData.vat } })
      fireEvent.change(inputPct, { target: { value: inputData.pct } })
      fireEvent.change(inputComment, { target: { value: inputData.commentary } })
      await waitFor(() => { userEvent.upload(inputFile, inputData.file) })
    
      // Submit form
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
      form.addEventListener('submit', handleSubmit)
      fireEvent.submit(form)

      // check function called
      expect(handleSubmit).toHaveBeenCalled()

      // Verify input validity
      expect(inputType.validity.valid).not.toBeTruthy()
      expect(inputDate.validity.valid).not.toBeTruthy()
      expect(inputAmmount.validity.valid).not.toBeTruthy()
      expect(inputPct.validity.valid).not.toBeTruthy()
    })
  })

// Test integration PUT
  describe('When I do fill fields in correct format and I click on submit button', () => {
    test('fetches update bill API PUT', async () => {
      jest.spyOn(mockStore, 'bills')
      jest.spyOn(console, 'error').mockImplementation(() => {})// Prevent Console.error jest error

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      Object.defineProperty(window, 'location', { value: { hash: ROUTES_PATH['NewBill'] } })

      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      document.body.innerHTML = `<div id="root"></div>`
      Router()

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const newBill = new NewBill({document,  onNavigate, store: mockStore, localStorage: window.localStorage})
    
      // Submit form
      const form = screen.getByTestId('form-new-bill')
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
      form.addEventListener('submit', handleSubmit)

      fireEvent.submit(form)
      await new Promise(process.nextTick)
      expect(console.error).not.toBeCalled()
    })
    test('fetches error from an API and fails with 500 error', async () => {
      jest.spyOn(mockStore, 'bills')
      jest.spyOn(console, 'error').mockImplementation(() => {})// Prevent Console.error jest error

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      Object.defineProperty(window, 'location', { value: { hash: ROUTES_PATH['NewBill'] } })

      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      document.body.innerHTML = `<div id="root"></div>`
      Router()

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      mockStore.bills.mockImplementationOnce(() => {
        return {
          update : jest.fn().mockRejectedValueOnce(false)
        }
      })
      const newBill = new NewBill({document,  onNavigate, store: mockStore, localStorage: window.localStorage})
    
      // Submit form
      const form = screen.getByTestId('form-new-bill')
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
      form.addEventListener('submit', handleSubmit)

      
      fireEvent.submit(form)
      await new Promise(process.nextTick)
      expect(console.error).toBeCalled()
    })
  })  
})
