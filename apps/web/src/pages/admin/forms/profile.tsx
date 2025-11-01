//
//  profile.tsx
//  
//
//  Created by Calvin Fowler on 10/30/25.
//


import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import SectionLayout from '@/components/admin/SectionLayout';
import FormFieldsManager from '@/components/admin/forms/FormFieldsManager';

export default function AdminFormsProfile() {
  const nav = [
    { href: '/admin/forms/registration', label: 'Registration' },
    { href: '/admin/forms/login', label: 'Login' },
    { href: '/admin/forms/profile', label: 'Profile' },
  ];

  return (
    <AdminLayout title="Profile Form Fields">
      <SectionLayout title="Profile Fields" nav={nav}>
        <FormFieldsManager scope="profile" />
      </SectionLayout>
    </AdminLayout>
  );
}
