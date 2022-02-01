/**
 * @jest-environment jsdom
 */

 import LoginUI from "../views/LoginUI";
 import Login from "../containers/Login.js";
 import { ROUTES } from "../constants/routes";
 import { fireEvent, screen } from "@testing-library/dom";
 
 describe("Given that I am a user on login page", () => {
   describe("When I do fill fields in correct format and I click on employee button Login In", () => {
     test("Then I should be identified as an Employee in app", () => {
       document.body.innerHTML = LoginUI();
       const inputData = {
         email: "johndoe@email.com",
         password: "azerty",
       };
 
       const inputEmailUser = screen.getByTestId("employee-email-input");
       fireEvent.change(inputEmailUser, { target: { value: inputData.email } });
       expect(inputEmailUser.value).toBe(inputData.email);
 
       const inputPasswordUser = screen.getByTestId("employee-password-input");
       fireEvent.change(inputPasswordUser, {
         target: { value: inputData.password },
       });
       expect(inputPasswordUser.value).toBe(inputData.password);
 
       const form = screen.getByTestId("form-employee");
 
       // localStorage should be populated with form data
       Object.defineProperty(window, "localStorage", {
         value: {
           getItem: jest.fn(() => null),
           setItem: jest.fn(() => null),
         },
         writable: true,
       });
 
       // we have to mock navigation to test it
       const onNavigate = (pathname) => {
         document.body.innerHTML = ROUTES({ pathname });
       };
 
       let PREVIOUS_LOCATION = "";
 
       const store = jest.fn();
 
       const login = new Login({
         document,
         localStorage: window.localStorage,
         onNavigate,
         PREVIOUS_LOCATION,
         store,
       });
 
       const handleSubmit = jest.fn(login.handleSubmitEmployee);
       login.login = jest.fn().mockResolvedValue({});
       form.addEventListener("submit", handleSubmit);
       fireEvent.submit(form);
       expect(handleSubmit).toHaveBeenCalled();
       expect(window.localStorage.setItem).toHaveBeenCalled();
       expect(window.localStorage.setItem).toHaveBeenCalledWith(
         "user",
         JSON.stringify({
           type: "Employee",
           email: inputData.email,
           password: inputData.password,
           status: "connected",
         })
       );
     });
 
     test("It should renders Bills page", () => {
       expect(screen.getAllByText("Mes notes de frais")).toBeTruthy();
     });
   });
 });
 