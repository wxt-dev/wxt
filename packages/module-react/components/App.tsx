export default function () {
  const [count, setCount] = useState(0);
  const increment = () => setCount((count) => count + 1);
  return <button onClick={increment}>Count: {count}</button>;
}
