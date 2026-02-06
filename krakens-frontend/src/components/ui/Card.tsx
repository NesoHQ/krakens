interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${
        hover ? 'hover:shadow-md transition-shadow' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
