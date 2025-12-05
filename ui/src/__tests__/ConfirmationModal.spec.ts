import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ConfirmationModal from '../components/ConfirmationModal.vue';

describe('ConfirmationModal', () => {
  it('renders when open and emits confirm/cancel', async () => {
    const wrapper = mount(ConfirmationModal, {
      props: {
        open: true,
        title: 'Delete',
        message: 'Are you sure?',
      },
    });

    expect(wrapper.text()).toContain('Delete');
    expect(wrapper.text()).toContain('Are you sure?');

    await wrapper.get('button.btn-primary').trigger('click');
    await wrapper.get('button.btn').trigger('click');

    expect(wrapper.emitted('confirm')).toBeTruthy();
    expect(wrapper.emitted('cancel')).toBeTruthy();
  });
});
