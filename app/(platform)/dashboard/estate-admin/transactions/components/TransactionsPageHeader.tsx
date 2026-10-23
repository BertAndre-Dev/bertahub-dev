"use client";

type Props = {
  estateName: string;
};

export function TransactionsPageHeader({
  estateName,
}: Readonly<Props>) {
  return (
    <div>
      <h1 className="font-heading text-3xl font-bold">Transactions</h1>
      <p className="text-muted-foreground mt-1">
        Welcome back! Here's is an overview on{" "}
        <span className="text-[18px] font-bold underline uppercase text-black">
          {estateName}
        </span>
        {"."}
      </p>
    </div>
  );
}
