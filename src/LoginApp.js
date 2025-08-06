import React, { useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function LoginApp({ onLoginSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [roles, setRoles] = useState([]);
    const [selectedRole, setSelectedRole] = useState(null);
    const [tempToken, setTempToken] = useState(null); // simpan token sementara untuk decode user_id

    const handleLogin = async () => {
        try {
            const res = await axios.post('http://localhost:3000/auth/login', {
                username,
                password
            });

            if (res.data.token) {
                onLoginSuccess(res.data.token);
            } else if (res.data.roles && res.data.tempToken) {
                setRoles(res.data.roles);
                setTempToken(res.data.tempToken); // simpan untuk digunakan saat select-role
            }
        } catch (err) {
            alert('Login failed');
            console.error(err);
        }
    };

    const handleRoleSelect = async () => {
        try {
            const decoded = jwtDecode(tempToken); // ambil user_id dari tempToken
            const res = await axios.post('http://localhost:3000/auth/select-role', {
                user_id: decoded.user_id,
                selected_role_id: selectedRole
            });
            const finalToken = res.data.token;
            onLoginSuccess(finalToken);
        } catch (err) {
            alert('Select role failed');
            console.error(err);
        }
    };

    return (
        <div className="container d-flex align-items-center justify-content-center min-vh-100">
            <div className="card shadow p-4 w-100" style={{ maxWidth: '400px' }}>
                <h2 className="mb-4">Login</h2>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="form-control mb-3"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-control mb-3"
                />
                <button onClick={handleLogin} className="btn btn-primary w-100 mb-3">
                    Login
                </button>

                {roles.length > 0 && (
                    <div>
                        <h5>Select Role:</h5>
                        <select
                            className="form-select mb-2"
                            value={selectedRole || ''}
                            onChange={(e) => setSelectedRole(e.target.value)}
                        >
                            <option value="">-- Select Role --</option>
                            {roles.map((r) => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                        <button onClick={handleRoleSelect} className="btn btn-success w-100">
                            Confirm Role
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function MenuTree({ menus }) {
    return (
        <ul className="list-group list-group-flush">
            {menus.map((menu) => (
                <MenuItem key={menu.id} menu={menu} />
            ))}
        </ul>
    );
}

function MenuItem({ menu }) {
    const [open, setOpen] = useState(false);
    const hasChildren = menu.children && menu.children.length > 0;

    return (
        <li className="list-group-item bg-white border-0 px-2 py-1">
            <div
                className={`d-flex justify-content-between align-items-center rounded ${hasChildren ? 'fw-bold' : ''}`}
                style={{ cursor: hasChildren ? 'pointer' : 'default', padding: '8px 12px' }}
                onClick={() => hasChildren && setOpen(!open)}
            >
                <span>{menu.name}</span>
                {hasChildren && (
                    <span className="badge bg-secondary rounded-pill" style={{ width: 24 }}>
                        {open ? '-' : '+'}
                    </span>
                )}
            </div>

            {hasChildren && open && (
                <ul className="list-group list-group-flush ps-4 mt-2 ms-1 border-start">
                    {menu.children.map((child) => (
                        <MenuItem key={child.id} menu={child} />
                    ))}
                </ul>
            )}
        </li>
    );
}


function Dashboard({ token }) {
    const [menus, setMenus] = useState([]);

    React.useEffect(() => {
        const fetchMenus = async () => {
            try {
                const res = await axios.get('http://localhost:3000/menus', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setMenus(res.data);
            } catch (err) {
                alert('Failed to fetch menus');
            }
        };
        fetchMenus();
    }, [token]);

    return (
        <div className="d-flex min-vh-100">
            <aside className="bg-dark text-white p-3" style={{ width: '250px' }}>
                <h4 className="mb-3">Navigation</h4>
                {menus.length > 0 ? (
                    <MenuTree menus={menus} />
                ) : (
                    <p className="text-muted">No menu available</p>
                )}
            </aside>
            <main className="flex-fill p-4">
                <h2>Dashboard</h2>
            </main>
        </div>
    );
}

export function App() {
    const [token, setToken] = useState(null);

    return token ? <Dashboard token={token} /> : <LoginApp onLoginSuccess={setToken} />;
}
