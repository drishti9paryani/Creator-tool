type IdeaStageProps = {
  value: string;
  onChange: (value: string) => void;
};

export function IdeaStage({ value, onChange }: IdeaStageProps) {
  return (
    <div className="mt-8 max-w-2xl">
      <p className="text-lg leading-8 text-[#405b70]">
        Describe the story, message, or video you want to make. A few sentences are enough.
      </p>
      <label htmlFor="client-idea" className="mt-7 block text-lg font-bold">
        Your idea
      </label>
      <textarea
        id="client-idea"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={7}
        autoFocus
        className="mt-3 w-full resize-y rounded-xl border-2 border-[#8ea1b2] bg-[#fbfcfd] px-5 py-4 text-lg leading-8 text-[#183247] outline-none placeholder:text-[#718598] focus:border-[#1d5b83] focus:ring-4 focus:ring-[#bdd9ec]"
        placeholder="For example: A family comes together for Sunday lunch and remembers someone they miss."
      />
    </div>
  );
}