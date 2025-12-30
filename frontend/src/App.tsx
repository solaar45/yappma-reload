import { Card, Metric, Text, AreaChart, Title, Grid } from "@tremor/react";

const chartdata = [
  { date: "Jan 23", SolarPanels: 2890, Inverters: 2338 },
  { date: "Feb 23", SolarPanels: 2756, Inverters: 2103 },
  { date: "Mar 23", SolarPanels: 3322, Inverters: 2194 },
  { date: "Apr 23", SolarPanels: 3470, Inverters: 2108 },
  { date: "May 23", SolarPanels: 3475, Inverters: 1812 },
  { date: "Jun 23", SolarPanels: 3129, Inverters: 1726 },
  { date: "Jul 23", SolarPanels: 3490, Inverters: 1982 },
  { date: "Aug 23", SolarPanels: 2903, Inverters: 2012 },
  { date: "Sep 23", SolarPanels: 2643, Inverters: 2342 },
  { date: "Oct 23", SolarPanels: 2837, Inverters: 2473 },
  { date: "Nov 23", SolarPanels: 2954, Inverters: 3848 },
  { date: "Dec 23", SolarPanels: 3239, Inverters: 3736 },
];

const dataFormatter = (number: number) => {
  return "€" + Intl.NumberFormat("us").format(number).toString();
};

export default function App() {
  return (
    <main className="p-12 bg-slate-50 min-h-screen">
      <Title className="mb-6">YAPPMA Dashboard Demo</Title>
      
      <Grid numItems={1} numItemsSm={2} numItemsLg={3} className="gap-6 mb-6">
        <Card decoration="top" decorationColor="indigo">
          <Text>Total Net Worth</Text>
          <Metric>€ 142,384</Metric>
        </Card>
        <Card decoration="top" decorationColor="fuchsia">
          <Text>Investments</Text>
          <Metric>€ 86,420</Metric>
        </Card>
        <Card decoration="top" decorationColor="amber">
          <Text>Cash</Text>
          <Metric>€ 12,500</Metric>
        </Card>
      </Grid>

      <Card>
        <Title>Portfolio Performance</Title>
        <AreaChart
          className="h-72 mt-4"
          data={chartdata}
          index="date"
          categories={["SolarPanels", "Inverters"]}
          colors={["indigo", "cyan"]}
          valueFormatter={dataFormatter}
        />
      </Card>
    </main>
  );
}