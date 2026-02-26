import React from 'react';

interface SEOComponentProps {
  schema?: Record<string, any>;
  children?: React.ReactNode;
}

/**
 * SEO Component - Adds structured data (JSON-LD) to the page
 * Used for rich snippets and better search engine understanding
 */
export const SEOComponent: React.FC<SEOComponentProps> = ({ schema, children }) => {
  if (!schema) return <>{children}</>;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      {children}
    </>
  );
};

interface StructuredDataProps {
  schema: Record<string, any>;
}

/**
 * Structured Data Component - Renders JSON-LD schema markup
 */
export const StructuredData: React.FC<StructuredDataProps> = ({ schema }) => {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

interface MetaTagProps {
  property: string;
  content: string;
}

/**
 * Meta Tag Component - Adds custom meta tags
 * Note: In Next.js, use Metadata object instead where possible
 */
export const MetaTag: React.FC<MetaTagProps> = ({ property, content }) => {
  return (
    <meta
      property={property}
      content={content}
    />
  );
};

/**
 * SEO-friendly image component wrapper
 */
interface SEOImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  title?: string;
}

export const SEOImage: React.FC<SEOImageProps> = ({
  src,
  alt,
  title,
  ...props
}) => {
  return (
    <img
      src={src}
      alt={alt}
      title={title || alt}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
};

/**
 * SEO Link Component with proper attributes
 */
interface SEOLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}

export const SEOLink: React.FC<SEOLinkProps> = ({
  href,
  children,
  external = false,
  ...props
}) => {
  const externalProps = external
    ? {
        rel: 'noopener noreferrer external',
        target: '_blank',
      }
    : {};

  return (
    <a href={href} {...externalProps} {...props}>
      {children}
    </a>
  );
};
