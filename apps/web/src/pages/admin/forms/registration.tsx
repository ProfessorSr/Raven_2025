import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import SectionLayout from '@/components/admin/SectionLayout';
import FormFieldsManager from '@/components/admin/forms/FormFieldsManager';

export default function AdminFormsRegistration() {
  const nav = [
    { href: '/admin/forms/registration', label: 'Registration' },
    { href: '/admin/forms/login', label: 'Login' },
    { href: '/admin/forms/profile', label: 'Profile' },
  ];

  return (
    <AdminLayout title="Registration Form Fields">
      <SectionLayout title="Registration Fields" nav={nav}>
        <FormFieldsManager scope="registration" />
      </SectionLayout>
    </AdminLayout>
  );
}
