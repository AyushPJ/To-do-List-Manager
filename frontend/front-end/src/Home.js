import axios from 'axios';
import React, { Component, createRef } from 'react';
import { Form, FloatingLabel, Container } from 'react-bootstrap'
import { Redirect } from 'react-router-dom'

class Login extends Component {
    constructor(props) {
        super(props);
        this.state = { authorized: false };
        this.loginUsername = createRef(null);
        this.loginPassword = createRef(null);
        this.registerUsername = createRef(null);
        this.registerPassword = createRef(null);
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
            })
            .catch((error) => {
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
                <Container>
                    <h3>Login</h3>
                    <Form noValidate onSubmit={(e) => this.submitCredentials(e, 'login')}>
                        <FloatingLabel className="mb-3 formElement" label="Username">

                            <Form.Control ref={this.loginUsername} type="text" id="floatingInputUsername" required />


                        </FloatingLabel>

                        <FloatingLabel className="mb-3 formElement" label="Password">

                            <Form.Control ref={this.loginPassword} type="password" id="floatingInputPassword" required />

                        </FloatingLabel>
                        <span className="formElement">
                            <button type="submit" className="btn btn-primary">Submit</button>
                        </span>
                    </Form>
                    <h3>Register</h3>
                    <Form noValidate onSubmit={(e) => this.submitCredentials(e, 'register')}>
                        <FloatingLabel className="mb-3 formElement" label="Username">

                            <Form.Control ref={this.registerUsername} type="text" id="floatingInputUsername" required />


                        </FloatingLabel>

                        <FloatingLabel className="mb-3 formElement" label="Password">

                            <Form.Control ref={this.registerPassword} type="password" id="floatingInputPassword" required />

                        </FloatingLabel>
                        <span className="formElement">
                            <button type="submit" className="btn btn-primary">Submit</button>
                        </span>
                    </Form>
                </Container>
            );
        }
        else
            return null;
    }
}

export default Login;