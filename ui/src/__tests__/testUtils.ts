import { mount, type Component, type MountingOptions, type VueWrapper } from '@vue/test-utils';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import Home from '../views/Home.vue';
import MonitorDetails from '../components/MonitorDetails.vue';

export const createTestRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'Home', component: Home },
      { path: '/monitors/:uuid', name: 'MonitorDetails', component: MonitorDetails, props: true },
    ],
  });

export const routerStubs = {
  RouterLink: {
    template: '<a><slot /></a>',
  },
  RouterView: {
    template: '<div />',
  },
};

export async function mountWithRouter<T extends Component>(
  component: T,
  options: MountingOptions<T> = {},
): Promise<{ wrapper: VueWrapper; router: Router }> {
  const router = createTestRouter();
  const wrapper = mount(component, {
    global: {
      plugins: [router],
      ...(options.global ?? {}),
    },
    ...options,
  });
  await router.isReady();
  return { wrapper, router };
}
