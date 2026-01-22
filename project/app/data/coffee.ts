export interface Coffee {
  id: string;
  name: string;
  description: string;
  image: string;
  portions: {
    small: number;
    medium: number;
    large: number;
  };
}

export const coffeeData: Coffee = {
  id: "espresso",
  name: "Premium Espresso",
  description: "Rich, aromatic espresso made from freshly ground beans. Perfect balance of intensity and smoothness.",
  image: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=1200&h=800&fit=crop",
  portions: {
    small: 2.50,
    medium: 3.00,
    large: 3.50,
  },
};
