import React from 'react';

export default function Footer() {
  return (
    <footer style={{
      textAlign: 'center',
      borderTop: '1px solid #e5e7eb',
      padding: '16px 0',
      marginTop: '40px',
      fontSize: '0.9em',
      opacity: 0.8,
    }}>
      <p>© {new Date().getFullYear()} Raven CMS — Built by Calvin Fowler</p>
    </footer>
  );
}
