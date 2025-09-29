import React from 'react';
import NewCustomerForm from "../components/Customers/NewCustomerForm";

const NewCustomerPage = () => {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Yeni Müşteri Formu</h2>
      <NewCustomerForm />
    </div>
  );
};

export default NewCustomerPage;