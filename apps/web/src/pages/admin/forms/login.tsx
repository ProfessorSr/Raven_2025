import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import SectionLayout from '@/components/admin/SectionLayout';
import FormFieldsManager from '@/components/admin/forms/FormFieldsManager';

export default function AdminFormsLogin() {
  const nav = [
    { href: '/admin/forms/registration', label: 'Registration' },
    { href: '/admin/forms/login',        label: 'Login' },
    { href: '/admin/forms/profile',      label: 'Profile' },
  ];

  return (
    <AdminLayout title="Login Form Fields">
      <SectionLayout title="Login Fields" nav={nav}>
        <FormFieldsManager scope="login" />
      </SectionLayout>
    </AdminLayout>
  );
}
