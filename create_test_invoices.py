#!/usr/bin/env python3

import requests
import sys
from datetime import datetime, timedelta

# Backend URL from environment
BACKEND_URL = "https://dynamiform.preview.emergentagent.com"

def create_test_invoices():
    """Create test invoices with different statuses for comprehensive testing"""
    
    print("=" * 80)
    print("CREATING TEST INVOICES WITH DIFFERENT STATUSES")
    print("=" * 80)
    
    # Create test invoices with different statuses and dates
    test_invoices = []
    
    # Create pending invoice
    pending_invoice_data = {
        "invoice_number": f"PENDING-{datetime.now().strftime('%Y%m%d%H%M%S')}-001",
        "customer_id": "test-customer-pending",
        "customer_name": "Pending Test Müşteri A.Ş.",
        "date": "2024-12-01",  # Recent date
        "currency": "TRY",
        "status": "pending",
        "items": [{"id": "1", "name": "Test Hizmet", "quantity": 1.0, "unit": "adet", "unit_price": 1000.0, "total": 1000.0}],
        "subtotal": 1000.0,
        "vat_rate": 20.0,
        "vat_amount": 200.0,
        "total": 1200.0,
        "conditions": "Pending test invoice",
        "payment_term": "30"
    }
    
    # Create paid invoice
    paid_invoice_data = {
        "invoice_number": f"PAID-{datetime.now().strftime('%Y%m%d%H%M%S')}-003",
        "customer_id": "test-customer-paid",
        "customer_name": "Paid Test Müşteri A.Ş.",
        "date": "2024-11-01",
        "currency": "TRY",
        "status": "paid",
        "items": [{"id": "3", "name": "Paid Hizmet", "quantity": 1.0, "unit": "adet", "unit_price": 2000.0, "total": 2000.0}],
        "subtotal": 2000.0,
        "vat_rate": 20.0,
        "vat_amount": 400.0,
        "total": 2400.0,
        "conditions": "Paid test invoice",
        "payment_term": "30"
    }
    
    # Create overdue invoice (old date with 30 day payment term)
    overdue_invoice_data = {
        "invoice_number": f"OVERDUE-{datetime.now().strftime('%Y%m%d%H%M%S')}-004",
        "customer_id": "test-customer-overdue",
        "customer_name": "Overdue Test Müşteri A.Ş.",
        "date": "2024-10-01",  # Old date to make it overdue
        "currency": "TRY",
        "status": "active",  # Active but overdue
        "items": [{"id": "4", "name": "Overdue Hizmet", "quantity": 1.0, "unit": "adet", "unit_price": 1500.0, "total": 1500.0}],
        "subtotal": 1500.0,
        "vat_rate": 20.0,
        "vat_amount": 300.0,
        "total": 1800.0,
        "conditions": "Overdue test invoice",
        "payment_term": "30"
    }
    
    # Create the test invoices
    invoice_endpoint = f"{BACKEND_URL}/api/invoices"
    test_invoice_data = [
        ("pending", pending_invoice_data),
        ("paid", paid_invoice_data),
        ("overdue", overdue_invoice_data)
    ]
    
    created_invoices = {}
    
    for invoice_type, invoice_data in test_invoice_data:
        try:
            print(f"\nCreating {invoice_type} invoice: {invoice_data['invoice_number']}")
            response = requests.post(invoice_endpoint, json=invoice_data, timeout=30)
            
            if response.status_code == 200:
                created_invoice = response.json()
                created_invoices[invoice_type] = created_invoice
                print(f"   ✅ PASS: {invoice_type} invoice created successfully")
                print(f"   ID: {created_invoice.get('id')}")
                print(f"   Status: {created_invoice.get('status')}")
                print(f"   Total: {created_invoice.get('total')} {created_invoice.get('currency')}")
            else:
                print(f"   ❌ FAIL: Failed to create {invoice_type} invoice: {response.status_code}")
                print(f"   Response: {response.text}")
                
        except Exception as e:
            print(f"   ❌ FAIL: Error creating {invoice_type} invoice: {str(e)}")
    
    print(f"\n✅ COMPLETED: Created {len(created_invoices)} test invoices successfully")
    return created_invoices

if __name__ == "__main__":
    print("🚀 Creating Test Invoices for Status Filtering Tests")
    print("=" * 80)
    
    created_invoices = create_test_invoices()
    
    print("\n" + "=" * 80)
    print("🏁 TEST INVOICE CREATION COMPLETE")
    print("=" * 80)
    
    if len(created_invoices) > 0:
        print("✅ SUCCESS: Test invoices created for comprehensive testing")
        print("   Created invoices:")
        for invoice_type, invoice_data in created_invoices.items():
            print(f"   • {invoice_type}: {invoice_data.get('invoice_number')} ({invoice_data.get('status')})")
        print("\n📋 Now you can run the invoice status filtering tests to see different statuses in action!")
    else:
        print("❌ FAILED: No test invoices were created")
        sys.exit(1)