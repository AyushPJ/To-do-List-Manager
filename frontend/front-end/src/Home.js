import axios from 'axios';
import React, { Component, createRef } from 'react';
import { Form, FloatingLabel, Container, Tabs, Tab, Alert } from 'react-bootstrap'
import { Redirect } from 'react-router-dom'

class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            authorized: null,
            key: 'login',
            invalid: {
                login: false,
                registerUsername: false,
            },
            showAlert: {
                loginFailed: false,
                registerSuccessful: false,
            }
        };
        this.loginUsername = createRef(null);
        this.loginPassword = createRef(null);
        this.registerUsername = createRef(null);
        this.registerPassword = createRef(null);

    }

    setPropState(prop, val) {
        let newState = Object.assign({}, this.state);
        if (val === "toggle")
            newState[prop] = !this.state[prop];
        else
            newState[prop] = val;
        this.setState(newState);
    }
    setInvalidState(prop, val) {
        let newInvalidState = Object.assign({}, this.state.invalid);
        let newState = Object.assign({}, this.state);
        if (val === "toggle")
            newInvalidState[prop] = !newInvalidState[prop];
        else
            newInvalidState[prop] = val;
        newState.invalid = newInvalidState;
        this.setState(newState);
    }
    showAlert(prop, val = true) {
        let newAlertState = Object.assign({}, this.state.showAlert);
        let newState = Object.assign({}, this.state);
        newAlertState[prop] = val;
        newState.showAlert = newAlertState;
        this.setState(newState);
        setTimeout(() => {
            this.showAlert(prop, false)
        }, 4000)
    }


    componentDidMount() {
        this.checkUserAuthorized();
    }

    submitCredentials(e, action) {
        e.preventDefault();
        let username = this[action + 'Username'].current.value;
        let password = this[action + 'Password'].current.value;
        axios.post('/' + action, { username: username, password: password })
            .then((resp) => {
                if (action === 'login')
                    this.setState({ authorized: true });
                if (action === 'register') {
                    this.setInvalidState('registerUsername', false);
                    this.showAlert('registerSuccessful');
                }
            })
            .catch((error) => {
                if (action === 'register' && error.response.status === 409) {
                    if (error.response.data && error.response.data.msg === "Username already taken")
                        this.setInvalidState('registerUsername', true);
                }
                else if (action === 'login')
                    this.showAlert('loginFailed');

                console.log(error);
            });

    }

    checkUserAuthorized() {
        axios.get("/isAuthorized", { headers: { 'Accepts': 'application/json' } })
            .then((resp) => {
                if (resp.status === 200)
                    this.setState({ authorized: true })

            })
            .catch((error) => {
                if (error.response.status === 401)
                    this.setState({ authorized: false });
                else
                    console.log(error);
            });
    }


    render() {

        if (this.state.authorized === true) {
            return <Redirect push to="/dashboard" />;
        }
        else if (this.state.authorized === false) {
            return (
                <React.Fragment>
                    <span className="logo homeLogo">
                        tu-du
                    </span>
                    <span className="tagline">
                        your personal to-do list manager
                    </span>
                    <Container style={{ maxWidth: "40rem" }}>
                        <Tabs
                            fill
                            justify
                            id="controlled-tab-home"
                            activeKey={this.state.key}
                            onSelect={(k) => this.setPropState("key", k)}
                            className="mb-3"
                        >
                            <Tab eventKey="login" title="Login">
                                <Form noValidate onSubmit={(e) => this.submitCredentials(e, 'login')}>
                                    <FloatingLabel className="mb-3 formElement" label="Username">

                                        <Form.Control ref={this.loginUsername} type="text" id="floatingInputUsernameLogin" required />


                                    </FloatingLabel>

                                    <FloatingLabel className="mb-3 formElement" label="Password">

                                        <Form.Control ref={this.loginPassword} type="password" id="floatingInputPasswordLogin" required />

                                    </FloatingLabel>
                                    <span className="formElement">
                                        <button type="submit" className="btn btn-primary">Log In</button>
                                    </span>
                                    <Alert show={this.state.showAlert.loginFailed} className="mb-3 formElement" variant="danger">
                                        Invalid username or password.
                                    </Alert>
                                </Form>
                            </Tab>
                            <Tab eventKey="register" title="Register">
                                <Form noValidate onSubmit={(e) => this.submitCredentials(e, 'register')}>
                                    <FloatingLabel className="mb-3 formElement validationElement" label="Username">

                                        <Form.Control isInvalid={this.state.invalid.registerUsername} ref={this.registerUsername} type="text" id="floatingInputUsernameRegister" required />
                                        <Form.Control.Feedback type="invalid" >
                                            Username already taken.
                                        </Form.Control.Feedback>

                                    </FloatingLabel>


                                    <FloatingLabel className="mb-3 formElement" label="Password">

                                        <Form.Control ref={this.registerPassword} type="password" id="floatingInputPasswordRegister" required />

                                    </FloatingLabel>
                                    <span className="formElement">
                                        <button type="submit" className="btn btn-primary">Register</button>
                                    </span>
                                    <Alert show={this.state.showAlert.registerSuccessful} className="mb-3 formElement" variant="success">
                                        User registered successfully.
                                    </Alert>
                                </Form>
                            </Tab>
                        </Tabs>


                    </Container>
                </React.Fragment>
            );
        }
        else
            return null;
    }
}

export default Login;