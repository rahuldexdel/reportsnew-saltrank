const GAdsOverview = ({ overview }: any) => {
  if (!overview) return null

  return (
    <>
      <h3 className="font-bold text-4xl text-center bg-black text-white py-2.5">
        Acquisition Overview
      </h3>
    </>
  )
}

export default GAdsOverview
