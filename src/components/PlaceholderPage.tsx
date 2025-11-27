import React from 'react';

interface PlaceholderPageProps {
    title: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-2xl font-bold mb-4">{title}</h1>
        <p className="text-muted-foreground">This page is under construction</p>
    </div>
);

export default PlaceholderPage;
