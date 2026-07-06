export default function Card({ children, className = '', padded = true, as: Tag = 'div', ...rest }) {
    return (
        <Tag
            className={`bg-(--color-paper) border border-(--color-line) rounded-[var(--radius-card)] ${padded ? 'p-5 sm:p-6' : ''} ${className}`}
            {...rest}
        >
            {children}
        </Tag>
    );
}
