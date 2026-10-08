import { forwardRef } from "react";
import { Link } from "react-router-dom";

export const Button = forwardRef(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      to,
      type = "button",
      children,
      ...props
    },
    ref,
  ) => {
    // Every variant has a 1px border (transparent where unseen) so buttons of
    // the same size are the same height whatever the variant. A trailing icon
    // (an arrow after the label) nudges forward on hover; a leading one stays
    const baseStyles =
      "inline-flex items-center justify-center border font-medium whitespace-nowrap cursor-pointer transition-[color,background-color,border-color,box-shadow,text-decoration-color,transform] duration-200 ease-out [&_svg]:shrink-0 [&_svg]:transition-transform [&_svg]:duration-200 hover:[&>svg:last-child:not(:first-child)]:translate-x-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:active:scale-100 motion-reduce:transition-none motion-reduce:[&_svg]:transition-none motion-reduce:active:scale-100";

    // Hovers tint with the button's own colour. Ghost uses a wash of the text
    // colour rather than bg-card, so it still shows inside a card
    const variants = {
      primary:
        "border-transparent bg-accent text-background shadow-[inset_0_1px_0_rgb(255_255_255/0.3)] hover:bg-accent-hover hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_8px_24px_-8px_var(--color-accent)]",
      secondary: "border-border bg-card text-foreground hover:border-accent hover:bg-accent/20",
      ghost: "border-transparent text-muted hover:bg-foreground/8 hover:text-foreground",
      // A text link that shrinks when pressed looks broken, so no scale
      link: "border-transparent text-accent underline decoration-transparent underline-offset-4 hover:decoration-current active:scale-100",
      danger: "border-danger/40 bg-card text-danger hover:border-danger hover:bg-danger/10",
    };

    // Pills, like every other control on the site (navbar pill, chips, the
    // When switch). Icon size and gap scale with the button:
    // sm 14px text + 16px icon, md/lg 16-18px text + 20px icon
    const sizes = {
      sm: "gap-1.5 rounded-full px-3.5 py-1.5 text-sm [&_svg]:size-4",
      md: "gap-2 rounded-full px-5 py-2.5 text-base [&_svg]:size-5",
      lg: "gap-2 rounded-full px-6 py-2.5 text-lg [&_svg]:size-5",
      icon: "rounded-full p-2 [&_svg]:size-4",
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

    // type defaults to "button": a bare <button> inside a form would submit it
    return (
      <button ref={ref} type={type} className={buttonClassName} {...props}>
        {children}
      </button>
    );
  },
);

export default Button;

Button.displayName = "Button";
