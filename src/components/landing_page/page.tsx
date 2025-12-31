import HeroSection from '../herosection/page'
import NavBar from '../navbar/page'
import Pricing from '../pricing/page'
import Docs from '../docs/page'
import UseCases from '../use_case/page'
import Footer from '../footer/page'


const LandingPage = () => {
  return (
    <div>
        <NavBar />
        <HeroSection/>
        <Pricing />
        <Docs />
        <UseCases/>
        <Footer/>


    </div>
  )
}

export default LandingPage;