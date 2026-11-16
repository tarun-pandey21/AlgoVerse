import { Link } from 'react-router-dom';
import './Button.css';

/**
 * One button component for the whole app.
 * - Pass `to` to render a React Router <Link> (for navigation).
 * - Otherwise renders a <button> (for actions).
 *
 * variant: 'primary' | 'secondary' | 'ghost' | 'soft'
 * size:    'sm' | 'md' | 'lg'
 */
export default function Button({
  to,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  fullWidth = false,
  className = '',
  children,
  type = 'button',
  ...rest
}) {
  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    fullWidth ? 'btn--full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const iconSize = size === 'sm' ? 15 : 17;
  const content = (
    <>
      {Icon && <Icon size={iconSize} strokeWidth={2.2} />}
      {children && <span>{children}</span>}
      {IconRight && <IconRight size={iconSize} strokeWidth={2.2} className="btn__icon-right" />}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...rest}>
      {content}
    </button>
  );
}
