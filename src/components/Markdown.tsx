import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** Renders stored Markdown. Raw HTML in the source is ignored, so content cannot inject scripts. */
export function Markdown({ children, className = 'answer' }: { children: string; className?: string }) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: (props) => (
            <div className="table-wrap">
              <table {...props} />
            </div>
          ),
          a: ({ href, ...props }) => {
            const external = href?.startsWith('http');
            return (
              <a
                href={href}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                {...props}
              />
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
