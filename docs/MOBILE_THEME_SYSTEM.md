# Mobile Theme System Specification

This document defines the standardized property structure for the mobile application's design system. All UI components must adhere to this specification to ensure type safety and consistent aesthetics.

## Typography Structure (`theme.typography`)

Access fonts and sizes via the following flat properties:

### Fonts (`theme.typography.fonts`)
| Property | Value (Literal) |
| :------- | :-------------- |
| `bold` | 'Outfit-Bold' |
| `semiBold` | 'Outfit-SemiBold' |
| `medium` | 'Inter-Medium' |
| `regular` | 'Inter-Regular' |
| `mono` | 'JetBrainsMono-Bold' |
| `monoRegular` | 'JetBrainsMono-Regular' |

### Sizes (`theme.typography.sizes`)
Standard numeric scales from `xxs` (9px) to `xxxl` (40px).

## Color System (`theme.colors`)

Note: As of V1.0.5, text properties are FLATTENED. Do not use nested objects.

| Property | Description |
| :------- | :---------- |
| `primary` | Core accent color (#00D4FF in Dark Mode) |
| `secondary` | Complementary color (#7B5FFF in Dark Mode) |
| `textPrimary` | Main readable text |
| `textSecondary` | Subheadings and descriptive text |
| `textTertiary` | Muted labels and secondary information |
| `surface` | Component backgrounds |
| `border` | Standard UI boundaries |
| `borderSubtle` | Subtle separators |

## Structural Tokens (`theme`)

| Property | Sub-properties | Notes |
| :------- | :------------- | :---- |
| `radius` | `sm`, `md`, `lg`, `xl` | Use `theme.radius.md` instead of legacy `roundness`. |
| `spacing` | `xs`, `sm`, `md`, `lg` | Standard layout gaps. |

## Usage Guidelines

1. **Strict Typing**: Usage of `StyleSheet.create` will enforce these types. Avoid passing arbitrary numeric values for `size` or `roundness` inside style objects.
2. **Theming**: Use the `useTheme()` hook to access these tokens dynamically across different theme modes (Dark, Light, Binance, Terminal).
