import Timeline from '@/components/Timeline';
import PromptBox from '@/components/PromptBox';

export default function Home() {
  return (
    <div 
      className="min-h-screen p-8 flex flex-col select-none" 
      style={{ backgroundColor: '#0a0807' }}
    >
      <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-100">Memoir</h1>
        </div>

        {/* Timeline Component */}
        <Timeline />

        {/* Prompt Box Component */}
        <PromptBox />
      </div>
    </div>
  );
}
