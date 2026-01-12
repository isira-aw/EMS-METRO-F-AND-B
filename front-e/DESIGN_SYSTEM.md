# Metropolitan EMS - Design System

Modern, minimal admin dashboard theme with clean flat UI, soft shadows, and rounded corners.

## Color Palette

### Primary Background
- **Dark Slate/Navy**: `#0F172A` or `bg-primary-bg`
- Used for main application background

### Cards & Modals
- **White Background**: `bg-white`
- All cards, modals, and content containers use white backgrounds

### Primary Actions
- **Blue**: `bg-blue-600` (default), `bg-blue-700` (hover)
- All primary action buttons use blue

### Error States
- **Background**: `bg-red-50`
- **Border**: `border-red-200`
- **Text**: `text-red-700`

### Text Colors
- **Headings**: `text-slate-900`
- **Body text**: `text-slate-600`
- **Muted text**: `text-slate-400`

---

## Typography

### Page Titles
```jsx
<h1 className="page-title">Dashboard</h1>
// Renders as: text-3xl font-bold text-slate-900
```

### Section Titles
```jsx
<h2 className="section-title">Recent Activities</h2>
// Renders as: text-xl font-semibold text-slate-900
```

### Labels
```jsx
<label className="input-label">Email Address</label>
// Renders as: text-sm font-medium text-slate-700
```

### Body Text
```jsx
<p className="body-text">This is body text</p>
// Renders as: text-sm text-slate-600
```

### Muted Text
```jsx
<p className="muted-text">Last updated 2 hours ago</p>
// Renders as: text-sm text-slate-400
```

---

## Buttons

### Primary Button
Default action button with blue background.

```jsx
<button className="btn-primary">Save Changes</button>
<button className="btn-primary" disabled>Processing...</button>
```

**Styles**:
- Background: `bg-blue-600`
- Hover: `hover:bg-blue-700`
- Disabled: `bg-blue-400 cursor-not-allowed`
- Rounded: `rounded-lg`
- Text: `text-white font-medium`

### Secondary Button
Text-style button with blue text and subtle hover background.

```jsx
<button className="btn-secondary">Cancel</button>
```

**Styles**:
- Text: `text-blue-600`
- Hover: `hover:text-blue-700 hover:bg-blue-50`
- Rounded: `rounded-lg`

### Success Button
Green action button for positive actions.

```jsx
<button className="btn-success">Approve</button>
```

**Styles**:
- Background: `bg-green-600`
- Hover: `hover:bg-green-700`
- Disabled: `bg-green-400 cursor-not-allowed`

### Danger Button
Red button for destructive actions.

```jsx
<button className="btn-danger">Delete</button>
```

**Styles**:
- Background: `bg-red-600`
- Hover: `hover:bg-red-700`
- Disabled: `bg-red-400 cursor-not-allowed`

---

## Input Fields

### Standard Input
```jsx
<div className="form-group">
  <label className="input-label">Username</label>
  <input type="text" className="input-field" />
</div>
```

**Styles**:
- Border: `border-slate-300`
- Rounded: `rounded-lg`
- Focus: `focus:ring-2 focus:ring-blue-500 focus:border-transparent`

### Error State Input
```jsx
<input type="email" className="input-field-error" />
<p className="error-text">Invalid email address</p>
```

**Styles**:
- Border: `border-red-300`
- Background: `bg-red-50`
- Focus: `focus:ring-2 focus:ring-red-500`

---

## Cards & Containers

### Standard Card
```jsx
<div className="card">
  <h3 className="section-title">Card Title</h3>
  <p className="body-text">Card content goes here</p>
</div>
```

**Styles**: `bg-white shadow-md rounded-lg p-6`

### Stat Card (with colored border)
```jsx
<div className="stat-card border-blue-600">
  <p className="muted-text">Total Users</p>
  <h2 className="text-3xl font-bold text-blue-600">1,234</h2>
</div>
```

**Styles**: `bg-white shadow-md rounded-lg p-6 border-l-4`

---

## Modals

### Modal Structure
```jsx
<div className="modal-backdrop">
  <div className="modal-container">
    <div className="flex justify-between items-center mb-4">
      <h2 className="section-title">Modal Title</h2>
      <button onClick={onClose}>×</button>
    </div>

    <div className="body-text">
      Modal content goes here
    </div>

    <div className="action-buttons mt-6">
      <button className="btn-secondary">Cancel</button>
      <button className="btn-primary">Confirm</button>
    </div>
  </div>
</div>
```

**Backdrop**: `fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50`

**Container**: `bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full`

---

## Tables

### Table Structure
```jsx
<div className="table-container">
  <table className="table">
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Role</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>John Doe</td>
        <td>john@example.com</td>
        <td>Admin</td>
      </tr>
    </tbody>
  </table>
</div>
```

**Header Styles**:
- Background: `bg-slate-100`
- Text: `text-slate-700 font-semibold text-sm`

**Row Styles**:
- Border: `border-b border-slate-200`
- Hover: `hover:bg-slate-50`

**Cell Styles**:
- Padding: `px-4 py-3`
- Text: `text-sm text-slate-600`

---

## Dropdowns

```jsx
<div className="dropdown">
  <button className="dropdown-item">Option 1</button>
  <button className="dropdown-item">Option 2</button>
  <button className="dropdown-item">Option 3</button>
</div>
```

**Container**: `bg-white rounded-lg shadow-lg border border-slate-200`

**Items**: `px-4 py-2 text-sm text-slate-700 hover:bg-slate-100`

---

## Error States

### Error Container
```jsx
<div className="error-container">
  <h4 className="error-title">Error</h4>
  <p className="error-text">Something went wrong. Please try again.</p>
</div>
```

**Styles**:
- Background: `bg-red-50`
- Border: `border border-red-200`
- Text: `text-red-700`

---

## Empty States

```jsx
<div className="empty-state">
  <svg className="empty-state-icon w-16 h-16">...</svg>
  <p className="empty-state-text">No items found</p>
  <a href="#" className="empty-state-action">Create your first item</a>
</div>
```

**Styles**:
- Icon: `text-slate-300 mb-4`
- Text: `text-slate-500 text-sm`
- Action: `text-blue-600 text-sm hover:text-blue-700`

---

## Utility Classes

### Form Group
```jsx
<div className="form-group">
  {/* Form field */}
</div>
```
Adds bottom margin: `mb-4`

### Action Buttons
```jsx
<div className="action-buttons">
  <button className="btn-secondary">Cancel</button>
  <button className="btn-primary">Save</button>
</div>
```
Flex container with gap: `flex gap-2 justify-end`

---

## Design Principles

1. **No Gradients**: Use solid colors only for a clean, modern look
2. **Rounded Corners**: Use `rounded-lg` (8px) for most elements, `rounded-2xl` for modals
3. **Soft Shadows**: `shadow-md` for cards, `shadow-lg` for dropdowns, `shadow-2xl` for modals
4. **Consistent Spacing**: Use Tailwind's spacing scale (px-4, py-2, gap-6, etc.)
5. **Minimal Animation**: Only use subtle transitions on interactive elements
6. **Flat UI**: No 3D effects, keep everything clean and minimal

---

## Common Patterns

### Form with Error Handling
```jsx
<form className="space-y-4">
  <div className="form-group">
    <label className="input-label">Email</label>
    <input
      type="email"
      className={errors.email ? "input-field-error" : "input-field"}
    />
    {errors.email && (
      <p className="error-text mt-1">{errors.email}</p>
    )}
  </div>

  <div className="action-buttons">
    <button type="submit" className="btn-primary">Submit</button>
  </div>
</form>
```

### Dashboard Stat Cards
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <div className="stat-card border-blue-600">
    <p className="muted-text">Total Users</p>
    <h2 className="text-3xl font-bold text-blue-600">1,234</h2>
  </div>

  <div className="stat-card border-green-600">
    <p className="muted-text">Active Jobs</p>
    <h2 className="text-3xl font-bold text-green-600">56</h2>
  </div>
</div>
```

### Confirmation Modal
```jsx
<div className="modal-backdrop">
  <div className="modal-container max-w-md">
    <h2 className="section-title mb-4">Confirm Delete</h2>
    <p className="body-text mb-6">
      Are you sure you want to delete this item? This action cannot be undone.
    </p>
    <div className="action-buttons">
      <button className="btn-secondary" onClick={onCancel}>Cancel</button>
      <button className="btn-danger" onClick={onConfirm}>Delete</button>
    </div>
  </div>
</div>
```

---

## Migration Guide

### Updating Existing Components

1. **Replace gray colors with slate**:
   - `text-gray-600` → `text-slate-600`
   - `bg-gray-100` → `bg-slate-100`
   - `border-gray-300` → `border-slate-300`

2. **Update button classes**:
   - Use predefined `.btn-*` classes instead of inline Tailwind
   - Ensure all buttons have `rounded-lg` instead of `rounded`

3. **Update input fields**:
   - Replace custom input classes with `.input-field`
   - Use `.input-field-error` for error states
   - Add `.input-label` for all labels

4. **Standardize modals**:
   - Use `.modal-backdrop` and `.modal-container`
   - Replace `rounded-lg` with `rounded-2xl` for modals

5. **Update tables**:
   - Wrap tables in `.table-container`
   - Add `.table` class to `<table>` elements
   - Ensure headers use `bg-slate-100`

---

## Browser Support

The design system uses modern CSS features supported in:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

All Tailwind utilities are autoprefixed for maximum compatibility.
