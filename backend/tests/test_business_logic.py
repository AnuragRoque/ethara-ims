"""Tests for the high-risk transactional paths and business rules."""

from decimal import Decimal


def test_duplicate_sku(client):
    """Attempt to create two products with the same SKU (Expect 409)."""
    payload = {
        "name": "Test Product",
        "sku": "SKU-001",
        "price": 10.00,
        "quantity": 50
    }
    
    # First creation should succeed
    response1 = client.post("/products", json=payload)
    assert response1.status_code == 201

    # Second creation should fail with 409 Conflict
    response2 = client.post("/products", json=payload)
    assert response2.status_code == 409
    assert "already exists" in response2.json()["detail"]


def test_duplicate_email(client):
    """Attempt to create two customers with the same email (Expect 409)."""
    payload = {
        "full_name": "Test Customer",
        "email": "test@example.com"
    }

    # First creation should succeed
    response1 = client.post("/customers", json=payload)
    assert response1.status_code == 201

    # Second creation should fail with 409 Conflict
    response2 = client.post("/customers", json=payload)
    assert response2.status_code == 409
    assert "already exists" in response2.json()["detail"]


def test_valid_order_success(client):
    """Place a valid order, verify stock decrements and total amount."""
    # 1. Create a product
    prod_resp = client.post("/products", json={
        "name": "Widget",
        "sku": "WDG-01",
        "price": 15.50,
        "quantity": 10
    })
    assert prod_resp.status_code == 201
    product_id = prod_resp.json()["id"]

    # 2. Create a customer
    cust_resp = client.post("/customers", json={
        "full_name": "Alice",
        "email": "alice@example.com"
    })
    assert cust_resp.status_code == 201
    customer_id = cust_resp.json()["id"]

    # 3. Create the order
    order_payload = {
        "customer_id": customer_id,
        "items": [
            {
                "product_id": product_id,
                "quantity": 4
            }
        ]
    }
    order_resp = client.post("/orders", json=order_payload)
    assert order_resp.status_code == 201
    order_data = order_resp.json()

    # Verify total amount computation
    assert order_data["total_amount"] == "62.00"  # 15.50 * 4
    assert len(order_data["items"]) == 1
    assert order_data["items"][0]["subtotal"] == "62.00"

    # 4. Verify stock decremented
    prod_check = client.get(f"/products/{product_id}")
    assert prod_check.json()["quantity"] == 6  # 10 - 4


def test_insufficient_stock_order(client):
    """Place an order for more stock than available (Expect 400)."""
    # 1. Create a product with limited stock
    prod_resp = client.post("/products", json={
        "name": "Widget",
        "sku": "WDG-02",
        "price": 15.50,
        "quantity": 2
    })
    product_id = prod_resp.json()["id"]

    # 2. Create a customer
    cust_resp = client.post("/customers", json={
        "full_name": "Bob",
        "email": "bob@example.com"
    })
    customer_id = cust_resp.json()["id"]

    # 3. Create the order with quantity 5 (more than 2)
    order_payload = {
        "customer_id": customer_id,
        "items": [
            {
                "product_id": product_id,
                "quantity": 5
            }
        ]
    }
    order_resp = client.post("/orders", json=order_payload)
    assert order_resp.status_code == 400
    assert "Insufficient stock" in order_resp.json()["detail"]

    # 4. Verify stock did NOT decrement
    prod_check = client.get(f"/products/{product_id}")
    assert prod_check.json()["quantity"] == 2


def test_order_cancellation_restocking(client):
    """Delete an order and verify the stock is returned to the product."""
    # 1. Create product and customer
    prod_resp = client.post("/products", json={
        "name": "Widget",
        "sku": "WDG-03",
        "price": 10.00,
        "quantity": 20
    })
    product_id = prod_resp.json()["id"]

    cust_resp = client.post("/customers", json={
        "full_name": "Charlie",
        "email": "charlie@example.com"
    })
    customer_id = cust_resp.json()["id"]

    # 2. Place an order for 5 items
    order_payload = {
        "customer_id": customer_id,
        "items": [
            {
                "product_id": product_id,
                "quantity": 5
            }
        ]
    }
    order_resp = client.post("/orders", json=order_payload)
    assert order_resp.status_code == 201
    order_id = order_resp.json()["id"]

    # Stock should be 15
    assert client.get(f"/products/{product_id}").json()["quantity"] == 15

    # 3. Delete (cancel) the order
    delete_resp = client.delete(f"/orders/{order_id}")
    assert delete_resp.status_code == 204

    # 4. Verify stock restocked back to 20
    assert client.get(f"/products/{product_id}").json()["quantity"] == 20
