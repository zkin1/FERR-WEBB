// jest.setup.js
// Configuración simple para Jest

// Mock de localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock de console para reducir ruido
global.console = {
  ...console,
  log: console.log, // Mantener logs
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: console.error, // Mantener errores
};

// Mock de fetch
global.fetch = jest.fn();

// Mock básico de document
global.document = {
  getElementById: jest.fn(),
  createElement: jest.fn(() => ({
    id: '',
    className: '',
    innerHTML: '',
    textContent: '',
    style: {},
    type: 'text',
    setAttribute: jest.fn(),
    appendChild: jest.fn(),
    addEventListener: jest.fn(),
    remove: jest.fn(),
  })),
  body: { appendChild: jest.fn() },
  head: { appendChild: jest.fn() },
  cookie: '',
};

// Mock básico de window
global.window = {
  location: {
    protocol: 'http:',
    hostname: 'localhost',
    port: '3002',
    href: 'http://localhost:3002',
    pathname: '/test',
    search: '',
    origin: 'http://localhost:3002'
  },
  localStorage: localStorageMock,
  APP_CONFIG: { API_URL: 'http://localhost:3002/api' }
};

// Asignar localStorage globalmente
global.localStorage = localStorageMock;

// Limpiar mocks después de cada test
afterEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
});