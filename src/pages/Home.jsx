import { Button } from "@/components/ui/button";
import { os } from "@/api";
function Home() {
  return (
    <div>
      <p>Home Page</p>
      <Button onClick={async() => {
        let res = await os.getCpuInfo()
        console.log(res)
      }}>api请求</Button>
    </div>
  );
}

export default Home;
