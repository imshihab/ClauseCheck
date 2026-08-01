Here is a complete, reusable boilerplate using React and Tailwind CSS to implement this specific Neobrutalist design system.

This template abstracts the core visual language (hard shadows, thick borders, high-contrast colors) into a highly reusable configuration and component library that you can drop straight into your projects.

1. Tailwind Configuration (tailwind.config.js)

First, extend your Tailwind theme to include the strict color palette and the signature hard drop shadows.

/** @type {import('tailwindcss').Config} */

module.exports = {

content: [

"./src/**/*.{js,jsx,ts,tsx}",

],

theme: {

extend: {

colors: {

neo: {

bg: '#F5F2EB', // Off-white base

black: '#121212', // Foreground/Borders

yellow: '#FACC15', // Primary Action

blue: '#2563EB', // Accent/Identity

green: '#22C55E', // Success

red: '#DC2626', // Intensity

gray: '#D4D4D4' // Inactive

}

},

boxShadow: {

// The signature Neobrutalist hard shadow

'neo': '4px 4px 0px 0px #121212',

'neo-sm': '2px 2px 0px 0px #121212',

// Optional: Hover state shadow for interactive elements

'neo-hover': '6px 6px 0px 0px #121212',

},

fontFamily: {

sans: ['Inter', 'system-ui', 'sans-serif'],

}

},

},

plugins: [],

}



2. Global Styles (index.css)

Ensure the application background matches the off-white base and applies the default typography.

@tailwind base;

@tailwind components;

@tailwind utilities;



@layer base {

body {

@apply bg-neo-bg text-neo-black font-sans antialiased;

}

}



3. Core UI Components (src/components/NeoUI.jsx)

This file contains the foundational building blocks: Buttons, Cards, and Inputs.

import React from 'react';



// --- BUTTON COMPONENT ---

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {

const baseStyles = "px-6 py-4 font-black uppercase tracking-wider transition-transform active:translate-y-[2px] active:translate-x-[2px] active:shadow-neo-sm border-2 border-neo-black shadow-neo flex items-center justify-center gap-2";


const variants = {

primary: "bg-neo-yellow text-neo-black",

dark: "bg-neo-black text-white",

outline: "bg-white text-neo-black",

blue: "bg-neo-blue text-white",

green: "bg-neo-green text-white",

red: "bg-neo-red text-white",

};



return (

<button

className={`${baseStyles} ${variants[variant]} ${className}`}

{...props}

>

{children}

</button>

);

};



// --- CARD COMPONENT ---

export const Card = ({ children, variant = 'default', className = '', ...props }) => {

const baseStyles = "border-2 border-neo-black p-6";


const variants = {

default: "bg-white shadow-neo",

dark: "bg-neo-black text-white shadow-neo",

flat: "bg-transparent shadow-none p-0 border-none", // For layout wrappers

};



return (

<div className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>

{children}

</div>

);

};



// --- INPUT COMPONENT ---

export const Input = ({ className = '', ...props }) => {

return (

<input

className={`w-full bg-white border-2 border-neo-black shadow-neo p-4 font-medium text-lg outline-none focus:ring-0 focus:shadow-neo-hover transition-shadow ${className}`}

{...props}

/>

);

};



// --- TYPOGRAPHY WRAPPERS ---

export const Title = ({ children, className = '' }) => (

<h1 className={`text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none ${className}`}>

{children}

</h1>

);



export const Subtitle = ({ children, className = '' }) => (

<p className={`text-base md:text-lg font-medium text-neo-black/80 ${className}`}>

{children}

</p>

);



4. Implementation Example (src/App.jsx)

Here is how you snap those components together to build a view that mirrors the required structure, utilizing icons for a balanced visual hierarchy.

import React, { useState } from 'react';

import { Button, Card, Input, Title, Subtitle } from './components/NeoUI';

import { Zap, Check, ArrowRight, Folder } from 'lucide-react'; // Example icon library



export default function App() {

const [habit, setHabit] = useState('');



return (

<div className="min-h-screen max-w-md mx-auto p-6 flex flex-col gap-8 pb-24">


{/* Header Area */}

<header className="flex justify-between items-end border-b-4 border-neo-black pb-4">

<div>

<Title className="text-5xl">TODAY</Title>

<Subtitle className="uppercase tracking-widest text-sm font-bold mt-1 border-l-4 border-neo-black pl-2">

Wednesday, July 15

</Subtitle>

</div>

<button className="p-2 border-2 border-neo-black shadow-[2px_2px_0px_0px_#121212] bg-white active:translate-y-[1px] active:translate-x-[1px] active:shadow-none">

<Folder size={24} strokeWidth={2.5} />

</button>

</header>



{/* Hero / Action Card */}

<Card className="flex flex-col gap-6">

<div>

<Title>WHAT PROMISE</Title>

<Title className="text-neo-yellow">ARE YOU MAKING</Title>

<Title className="text-neo-red">TO YOURSELF?</Title>

</div>


<div className="border-l-4 border-neo-black pl-3 py-1">

<p className="uppercase text-xs font-bold tracking-widest text-neo-black">

Say it the way you mean it. This becomes your first habit.

</p>

</div>



<Input

placeholder="e.g., Sleep before midnight"

value={habit}

onChange={(e) => setHabit(e.target.value)}

/>



<Button variant="primary" className="w-full mt-4">

THIS IS MY PROMISE <ArrowRight size={20} strokeWidth={3} />

</Button>

</Card>



{/* Data / List Card Example */}

<Card variant="dark" className="flex flex-col gap-4">

<div className="flex justify-between items-start">

<div className="bg-neo-gray/20 p-2 border-2 border-neo-black">

<Zap size={24} className="text-neo-yellow" />

</div>

<div className="text-right">

<p className="uppercase text-[10px] tracking-widest text-neo-gray">Streak</p>

<p className="text-3xl font-black leading-none">01</p>

</div>

</div>


<h3 className="text-xl font-bold uppercase mt-2">Sleep Before Midnight</h3>


<Button variant="green" className="w-full mt-2 border-neo-black shadow-neo">

<Check size={20} strokeWidth={3} /> COMPLETED

</Button>

</Card>



</div>

);

}

