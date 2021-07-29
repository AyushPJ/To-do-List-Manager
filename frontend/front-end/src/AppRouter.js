import React, { Component} from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom/index';
import App from './App';
import Login from './Home';

class AppRouter extends Component {
    render() {
        return (
            <BrowserRouter>
                <Switch>
                    <Route path="/dashboard">
                        <App/>
                    </Route>
                    <Route path="/">
                        <Login/>
                    </Route>
                </Switch>
            </BrowserRouter>
        );
    }
}

export default AppRouter;