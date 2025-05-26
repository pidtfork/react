import { Switch, Route } from 'wouter';
import { routes } from './config';

const AppRoutes = () => (
  <Switch>
    {routes.map(({ path, component: Component }) => (
      <Route key={path} path={path} component={Component} />
    ))}
    <Route>404 Not Found</Route>
  </Switch>
);

export default AppRoutes