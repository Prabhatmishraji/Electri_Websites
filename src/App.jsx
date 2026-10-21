
import React, { useEffect, useMemo, useState } from "react";
import {
  Search, ShoppingBag, UserRound, Heart, Truck, ShieldCheck,
  Headphones, ArrowRight, Plus, Trash2, Edit3, X, LogOut,
  Menu, Package, LayoutDashboard
} from "lucide-react";
import "./App.css";

const API =
  import.meta.env.VITE_API_URL || "https://localhost:7151/api";

const demoProducts = [
  {
    productId: 1,
    name: "Nova X Pro Smartphone",
    categoryName: "Smartphones",
    price: 54999,
    discountPercent: 10,
    stockQuantity: 24,
    sku: "PHN-NOVA-X",
    imageUrl:
      "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=800&q=85",
    description: "Brilliant display, powerful performance and all-day battery."
  },
  {
    productId: 2,
    name: "Ultrabook Air 14",
    categoryName: "Laptops",
    price: 72999,
    discountPercent: 8,
    stockQuantity: 12,
    sku: "LAP-AIR-14",
    imageUrl:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=85",
    description: "Lightweight power for work, study and everyday life."
  },
  {
    productId: 3,
    name: "Studio Wireless Headphones",
    categoryName: "Audio",
    price: 8999,
    discountPercent: 15,
    stockQuantity: 35,
    sku: "AUD-STUDIO-01",
    imageUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=85",
    description: "Immersive sound and a comfortable fit."
  },
  {
    productId: 4,
    name: "Smart Watch Active",
    categoryName: "Accessories",
    price: 6999,
    discountPercent: 5,
    stockQuantity: 28,
    sku: "ACC-WATCH-A",
    imageUrl:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=85",
    description: "Keep your activity and notifications in view."
  },
  {
    productId: 5,
    name: "Gaming Controller Pro",
    categoryName: "Gaming",
    price: 4599,
    discountPercent: 0,
    stockQuantity: 18,
    sku: "GAM-CTRL-P",
    imageUrl:
      "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?auto=format&fit=crop&w=800&q=85",
    description: "Responsive controls for your gaming setup."
  },
  {
    productId: 6,
    name: "Portable Bluetooth Speaker",
    categoryName: "Audio",
    price: 3299,
    discountPercent: 12,
    stockQuantity: 41,
    sku: "AUD-SPEAKER-BT",
    imageUrl:
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=85",
    description: "Big sound in a compact, portable design."
  }
];

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);

const emptyProduct = {
  name: "",
  categoryName: "Smartphones",
  price: "",
  discountPercent: 0,
  stockQuantity: 0,
  sku: "",
  imageUrl: "",
  description: ""
};

export default function App() {
  const [products, setProducts] = useState(demoProducts);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [view, setView] = useState("shop");
  const [notice, setNotice] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [login, setLogin] = useState({ email: "", password: "" });
  const [token, setToken] = useState("");
  const [loginError, setLoginError] = useState("");
  const [editing, setEditing] = useState(null);
  const [apiConnected, setApiConnected] = useState(false);

  const categories = useMemo(
    () => ["All", ...new Set(products.map(p => p.categoryName || "Electronics"))],
    [products]
  );

  const filtered = useMemo(
    () =>
      products.filter(p => {
        const matchesCategory =
          category === "All" || p.categoryName === category;
        const text =
          `${p.name} ${p.description || ""} ${p.categoryName || ""}`.toLowerCase();
        return matchesCategory && text.includes(search.toLowerCase());
      }),
    [products, category, search]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        const response = await fetch(`${API}/products`);
        if (!response.ok) throw new Error("API unavailable");

        const data = await response.json();
        if (!Array.isArray(data)) throw new Error("Unexpected API response");

        if (!cancelled) {
          setProducts(data);
          setApiConnected(true);
        }
      } catch {
        if (!cancelled) {
          setApiConnected(false);
        }
      }
    }

    loadProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  function notify(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2800);
  }

  function addToCart(product) {
    setCart(current => [...current, product]);
    notify(`${product.name} added to cart`);
  }

  function removeFromCart(index) {
    setCart(current => current.filter((_, i) => i !== index));
  }

  async function adminLogin(event) {
    event.preventDefault();
    setLoginError("");

    try {
      const response = await fetch(`${API}/auth/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(login)
      });

      const data = await response.json();

      if (!response.ok || !data.token) {
        throw new Error(data.message || "Invalid login or API configuration");
      }

      setToken(data.token);
      setView("admin");
      notify("Admin login successful");
    } catch (error) {
      setLoginError(
        `${error.message}. Check API URL, HTTPS certificate and backend login endpoint.`
      );
    }
  }

  async function saveProduct(event) {
    event.preventDefault();
    if (!token) {
      notify("Please sign in as admin first.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const id = form.get("productId");
    const selectedCategory = form.get("categoryName");
    const payload = {
      name: form.get("name"),
      sku: form.get("sku"),
      categoryName: selectedCategory,
      price: Number(form.get("price")),
      discountPercent: Number(form.get("discountPercent")),
      stockQuantity: Number(form.get("stockQuantity")),
      description: form.get("description"),
      imageUrl: form.get("imageUrl")
    };

    try {
      const response = await fetch(
        `${API}/products${id ? `/${id}` : ""}`,
        {
          method: id ? "PUT" : "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: (() => {
            const fd = new FormData();
            Object.entries(payload).forEach(([key, value]) =>
              fd.append(key, value ?? "")
            );
            if (form.get("image")?.size) {
              fd.append("image", form.get("image"));
            }
            return fd;
          })()
        }
      );

      if (!response.ok) {
        throw new Error("Product save failed. Check API field names.");
      }

      const responseProducts = await fetch(`${API}/products`);
      if (!responseProducts.ok) throw new Error("Could not reload products");

      setProducts(await responseProducts.json());
      setEditing(null);
      notify("Product saved successfully");
    } catch (error) {
      notify(error.message);
    }
  }

  async function deleteProduct(product) {
    if (!token) {
      notify("Please sign in as admin first.");
      return;
    }
    if (!window.confirm(`Delete ${product.name}?`)) return;

    try {
      const response = await fetch(
        `${API}/products/${product.productId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) throw new Error("Delete failed");

      setProducts(current =>
        current.filter(p => p.productId !== product.productId)
      );
      notify("Product deleted");
    } catch (error) {
      notify(error.message);
    }
  }

  const ProductCards = ({ items }) => (
    <div className="product-grid">
      {items.map((product, index) => (
        <article className="product-card" key={product.productId ?? index}>
          <div className="product-image">
            <img
              src={product.imageUrl || demoProducts[index % demoProducts.length].imageUrl}
              alt={product.name}
              onError={event => {
                event.currentTarget.src =
                  demoProducts[index % demoProducts.length].imageUrl;
              }}
            />
            {Number(product.discountPercent) > 0 && (
              <span className="discount">
                -{product.discountPercent}%
              </span>
            )}
            <button
              className="wishlist"
              aria-label="Add to wishlist"
              onClick={() => notify("Wishlist demo feature")}
            >
              <Heart size={18} />
            </button>
            <button className="quick-add" onClick={() => addToCart(product)}>
              <Plus size={17} /> Add to bag
            </button>
          </div>
          <div className="product-info">
            <div className="product-category">
              {product.categoryName || "Electronics"}
            </div>
            <h3>{product.name}</h3>
            <p className="description">{product.description}</p>
            <div className="product-price">
              <strong>
                {money(
                  Number(product.price) *
                  (1 - Number(product.discountPercent || 0) / 100)
                )}
              </strong>
              {Number(product.discountPercent) > 0 && (
                <del>{money(product.price)}</del>
              )}
              <span>★ 4.8</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );

  return (
    <div className="store">
      <div className="topbar">
        Free delivery on orders above ₹1,999 <span>•</span> Easy 7-day returns
      </div>

      <header className="header">
        <button
          className="menu-toggle"
          onClick={() => setMobileMenu(!mobileMenu)}
          aria-label="Toggle menu"
        >
          <Menu />
        </button>

        <button className="brand" onClick={() => setView("shop")}>
          <span className="brand-icon">e</span>
          electro<span>store</span>
        </button>

        <nav className={mobileMenu ? "nav open" : "nav"}>
          {["All", "Smartphones", "Laptops", "Audio", "Accessories", "Gaming"].map(c => (
            <button
              key={c}
              onClick={() => {
                setCategory(c);
                setView("shop");
                setMobileMenu(false);
              }}
            >
              {c === "All" ? "Shop all" : c}
            </button>
          ))}
          <button onClick={() => setView("adminLogin")}>Admin</button>
        </nav>

        <div className="header-actions">
          <label className="searchbox">
            <Search size={18} />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search products..."
            />
          </label>
          <button
            className="icon-button"
            onClick={() => setView("adminLogin")}
            aria-label="Admin sign in"
          >
            <UserRound />
          </button>
          <button
            className="icon-button cart-button"
            onClick={() => setView("cart")}
            aria-label="Shopping bag"
          >
            <ShoppingBag />
            <span>{cart.length}</span>
          </button>
        </div>
      </header>

      {view === "shop" && (
        <>
          <section className="hero">
            <div className="hero-copy">
              <div className="eyebrow">THE NEXT-GEN TECH EDIT</div>
              <h1>Good tech.<br /><em>Better living.</em></h1>
              <p>
                Discover the devices that make every day smarter, smoother
                and a little more extraordinary.
              </p>
              <button
                className="primary-button"
                onClick={() =>
                  document.getElementById("products")?.scrollIntoView({
                    behavior: "smooth"
                  })
                }
              >
                Explore collection <ArrowRight size={17} />
              </button>
              <div className="hero-proof">
                <span className="proof-icons">✓　★　+</span>
                <span><b>12k+</b> happy tech lovers</span>
              </div>
            </div>
            <div className="hero-art">
              <div className="hero-glow" />
              <img
                src={demoProducts[0].imageUrl}
                alt="Featured smartphone"
              />
              <div className="floating-card">
                <span>✦</span>
                <div>
                  <b>Made for more.</b>
                  <small>Technology, thoughtfully picked.</small>
                </div>
              </div>
              <div className="hero-sticker">NEW<br /><b>2026</b></div>
            </div>
            <div className="hero-caption">
              <span>01 / CURATED TECH</span>
              <span>DESIGNED FOR YOUR EVERYDAY ↘</span>
            </div>
          </section>

          <section className="benefits">
            <div><Truck /><span><b>Fast delivery</b><small>On orders above ₹1,999</small></span></div>
            <div><ShieldCheck /><span><b>Genuine products</b><small>Quality you can trust</small></span></div>
            <div><Headphones /><span><b>Here to help</b><small>Friendly customer support</small></span></div>
            <div><Heart /><span><b>Easy returns</b><small>Shop with confidence</small></span></div>
          </section>

          <section className="products-section" id="products">
            <div className="section-heading">
              <div>
                <div className="eyebrow">THE GOOD STUFF</div>
                <h2>Find your <em>next favourite.</em></h2>
                <p>Handpicked tech. No endless scrolling required.</p>
              </div>
              <button className="text-button" onClick={() => {
                setCategory("All");
                setSearch("");
              }}>
                View all products <ArrowRight size={17} />
              </button>
            </div>

            <div className="filter-row">
              <div className="category-pills">
                {categories.map(item => (
                  <button
                    key={item}
                    className={category === item ? "active" : ""}
                    onClick={() => setCategory(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <span className="result-count">{filtered.length} products</span>
            </div>

            {filtered.length ? (
              <ProductCards items={filtered} />
            ) : (
              <div className="empty-state">No products found. Try another search.</div>
            )}
          </section>

          <section className="promo">
            <div>
              <div className="eyebrow">YOUR SETUP, UPGRADED</div>
              <h2>Small upgrades.<br /><em>Big difference.</em></h2>
              <p>Thoughtful tech picks that fit your routine, space and style.</p>
              <button className="primary-button" onClick={() => {
                setCategory("Accessories");
                document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
              }}>
                Shop accessories <ArrowRight size={16} />
              </button>
            </div>
            <img
              src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=85"
              alt="Modern technology workspace"
            />
          </section>
        </>
      )}

      {view === "adminLogin" && (
        <section className="auth-section">
          <form className="auth-card" onSubmit={adminLogin}>
            <div className="brand-icon large">e</div>
            <div className="eyebrow">STORE MANAGEMENT</div>
            <h2>Welcome back.</h2>
            <p>Sign in to manage your product catalogue.</p>
            <label>
              Email address
              <input
                type="email"
                required
                value={login.email}
                onChange={e => setLogin({ ...login, email: e.target.value })}
                placeholder="admin@example.com"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                required
                value={login.password}
                onChange={e => setLogin({ ...login, password: e.target.value })}
                placeholder="Enter your password"
              />
            </label>
            {loginError && <p className="error-message">{loginError}</p>}
            <button className="primary-button full-width">Sign in <ArrowRight size={16} /></button>
            <button type="button" className="text-button" onClick={() => setView("shop")}>
              ← Back to store
            </button>
          </form>
        </section>
      )}

      {view === "admin" && (
        <section className="admin-section">
          <div className="section-heading">
            <div>
              <div className="eyebrow">CONTROL ROOM</div>
              <h2>Product <em>management.</em></h2>
              <p>Manage your store catalogue.</p>
            </div>
            <div className="admin-actions">
              <button className="secondary-button" onClick={() => {
                setToken("");
                setView("shop");
              }}>
                <LogOut size={16} /> Sign out
              </button>
              <button className="primary-button" onClick={() => setEditing(emptyProduct)}>
                <Plus size={17} /> Add product
              </button>
            </div>
          </div>

          <div className="stats-grid">
            <div><span>Total products</span><b>{products.length}</b></div>
            <div><span>Low stock</span><b>{products.filter(p => p.stockQuantity < 10).length}</b></div>
            <div><span>Categories</span><b>{categories.length - 1}</b></div>
            <div><span>Cart items</span><b>{cart.length}</b></div>
          </div>

          <div className="table-wrapper">
            <div className="table-title"><LayoutDashboard size={20} /> Product catalogue</div>
            <table>
              <thead>
                <tr><th>Product</th><th>SKU</th><th>Price</th><th>Stock</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.productId}>
                    <td>
                      <div className="table-product">
                        <img src={product.imageUrl} alt="" />
                        <span><b>{product.name}</b><small>{product.categoryName}</small></span>
                      </div>
                    </td>
                    <td>{product.sku || "—"}</td>
                    <td>{money(product.price)}</td>
                    <td>{product.stockQuantity}</td>
                    <td>
                      <button className="table-action" onClick={() => setEditing(product)} aria-label="Edit">
                        <Edit3 size={16} />
                      </button>
                      <button className="table-action danger" onClick={() => deleteProduct(product)} aria-label="Delete">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {editing && (
            <div className="modal-backdrop">
              <form className="product-modal" onSubmit={saveProduct}>
                <div className="modal-heading">
                  <div>
                    <div className="eyebrow">CATALOGUE EDITOR</div>
                    <h3>{editing.productId ? "Edit product" : "Add new product"}</h3>
                  </div>
                  <button type="button" className="icon-button" onClick={() => setEditing(null)}>
                    <X />
                  </button>
                </div>
                <input type="hidden" name="productId" value={editing.productId || ""} />
                <div className="form-grid">
                  <label>Product name *
                    <input name="name" required defaultValue={editing.name || ""} />
                  </label>
                  <label>SKU *
                    <input name="sku" required defaultValue={editing.sku || ""} />
                  </label>
                  <label>Category
                    <select name="categoryName" defaultValue={editing.categoryName || "Smartphones"}>
                      {["Smartphones", "Laptops", "Audio", "Accessories", "Gaming", "Smart Home"].map(c =>
                        <option key={c} value={c}>{c}</option>
                      )}
                    </select>
                  </label>
                  <label>Price (₹) *
                    <input name="price" type="number" min="0" required defaultValue={editing.price ?? ""} />
                  </label>
                  <label>Discount (%)
                    <input name="discountPercent" type="number" min="0" max="100" defaultValue={editing.discountPercent ?? 0} />
                  </label>
                  <label>Stock quantity
                    <input name="stockQuantity" type="number" min="0" defaultValue={editing.stockQuantity ?? 0} />
                  </label>
                  <label className="span-two">Description
                    <textarea name="description" rows="3" defaultValue={editing.description || ""} />
                  </label>
                  <label className="span-two">Product image URL
                    <input name="imageUrl" defaultValue={editing.imageUrl || ""} placeholder="https://..." />
                  </label>
                  <label className="span-two">Upload image
                    <input name="image" type="file" accept="image/png,image/jpeg,image/webp" />
                  </label>
                </div>
                <div className="modal-actions">
                  <button type="button" className="secondary-button" onClick={() => setEditing(null)}>Cancel</button>
                  <button className="primary-button"><Package size={16} /> Save product</button>
                </div>
              </form>
            </div>
          )}
        </section>
      )}

      {view === "cart" && (
        <section className="cart-section">
          <div className="eyebrow">YOUR BAG</div>
          <h2>A few good <em>choices.</em></h2>
          {cart.length === 0 ? (
            <div className="empty-state cart-empty">
              <ShoppingBag size={40} />
              <h3>Your bag is taking a break.</h3>
              <p>Add something you love from the collection.</p>
              <button className="primary-button" onClick={() => setView("shop")}>
                Explore products <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div className="cart-list">
              {cart.map((product, index) => (
                <div className="cart-row" key={`${product.productId}-${index}`}>
                  <img src={product.imageUrl} alt="" />
                  <div><b>{product.name}</b><small>{product.categoryName}</small></div>
                  <strong>{money(product.price * (1 - (product.discountPercent || 0) / 100))}</strong>
                  <button className="table-action danger" onClick={() => removeFromCart(index)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <div className="cart-total">
                <span>Subtotal</span>
                <b>{money(cart.reduce((sum, p) => sum + p.price * (1 - (p.discountPercent || 0) / 100), 0))}</b>
              </div>
              <button className="primary-button" onClick={() => notify("Checkout/payment API needs configuration.")}>
                Continue to checkout <ArrowRight size={16} />
              </button>
            </div>
          )}
        </section>
      )}

      <section className="newsletter">
        <div>
          <div className="eyebrow">THE GOOD TECH LETTER</div>
          <h2>A little more <em>in the know.</em></h2>
          <p>New drops, useful tips and member-only offers. No noise.</p>
        </div>
        <form onSubmit={e => {
          e.preventDefault();
          notify("Thank you for subscribing!");
          e.currentTarget.reset();
        }}>
          <input type="email" required placeholder="Your email address" />
          <button className="primary-button">Count me in <ArrowRight size={16} /></button>
        </form>
      </section>

      <footer className="footer">
        <div className="footer-top">
          <button className="brand" onClick={() => setView("shop")}>
            <span className="brand-icon">e</span> electro<span>store</span>
          </button>
          <p>Good tech for real life. Thoughtfully picked for every day.</p>
          <div className="footer-links">
            <button onClick={() => setView("shop")}>Shop</button>
            <button onClick={() => setView("cart")}>Shopping bag ({cart.length})</button>
            <button onClick={() => setView("adminLogin")}>Admin sign-in</button>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 ElectroStore</span>
          <span>{apiConnected ? "Live API connected" : "Preview catalogue"} · Built for better everyday tech.</span>
        </div>
      </footer>

      {notice && <div className="toast">{notice}</div>}
    </div>
  );
}
