import { forwardRef } from "react";
import { Link } from "react-router-dom";

export const Button = forwardRef(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      to,
      children,
      ...props
    },
    ref,
  ) => {
    // Every variant has a 1px border (transparent where unseen) so buttons of
    // the same size are the same height whatever the variant
    const baseStyles =
      "inline-flex items-center justify-center border font-medium whitespace-nowrap transition cursor-pointer [&_svg]:shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 motion-reduce:transition-none motion-reduce:active:scale-100";

    const variants = {
      primary: "border-transparent bg-accent text-background hover:bg-accent-hover",
      secondary: "border-border bg-card text-foreground hover:bg-border",
      ghost: "border-transparent text-muted hover:text-foreground hover:bg-card",
      link: "border-transparent text-accent underline-offset-4 hover:underline",
      danger: "border-red-400/40 bg-card text-red-400 hover:bg-red-400/10",
    };

    // Icon size, gap and corner radius scale with the button:
    // sm 14px text + 16px icon, md/lg 16-18px text + 20px icon
    const sizes = {
      sm: "gap-1.5 rounded-lg px-3 py-1.5 text-sm [&_svg]:size-4",
      md: "gap-2 rounded-xl px-5 py-2.5 text-base [&_svg]:size-5",
      lg: "gap-2 rounded-xl px-8 py-3 text-lg [&_svg]:size-5",
      icon: "rounded-lg p-2 [&_svg]:size-4",
    };

    // Text links keep the text and icon sizing but no button padding
    const linkSizes = {
      sm: "gap-1.5 rounded-sm text-sm [&_svg]:size-4",
      md: "gap-2 rounded-sm text-base [&_svg]:size-5",
      lg: "gap-2 rounded-sm text-lg [&_svg]:size-5",
      icon: "rounded-sm [&_svg]:size-4",
    };

    const sizeStyles = variant === "link" ? linkSizes[size] : sizes[size];
    const buttonClassName = `${baseStyles} ${variants[variant]} ${sizeStyles} ${className}`;

    if (to) {
      return (
        <Link ref={ref} to={to} className={buttonClassName} {...props}>
          {children}
        </Link>
      );
    }

    return (
      <button ref={ref} className={buttonClassName} {...props}>
        {children}
      </button>
    );
  },
);

export default Button;

Button.displayName = "Button";
